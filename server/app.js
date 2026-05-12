const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectToDatabase } = require("./lib/db");
const EmailRecord = require("./models/EmailRecord");
const { sendBulkEmail } = require("./services/mailer");
const {
  parseManualRecipients,
  mergeRecipients
} = require("./utils/parseRecipients");

dotenv.config();

const app = express();

app.use(
  cors({
    origin: true
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", async (_request, response) => {
  try {
    await connectToDatabase();
    response.json({ ok: true, message: "Bulk mail API is ready." });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Database connection failed.",
      error: error.message
    });
  }
});

app.get("/api/history", async (_request, response) => {
  try {
    await connectToDatabase();

    const history = await EmailRecord.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    response.json({
      ok: true,
      history
    });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Could not fetch email history.",
      error: error.message
    });
  }
});

app.post("/api/send", async (request, response) => {
  const {
    subject = "",
    body = "",
    manualRecipients = "",
    uploadedRecipients = [],
    uploadFileName = ""
  } = request.body || {};

  const trimmedSubject = subject.trim();
  const trimmedBody = body.trim();

  if (!trimmedSubject || !trimmedBody) {
    return response.status(400).json({
      ok: false,
      message: "Subject and email body are required."
    });
  }

  const { validRecipients, invalidRecipients } = mergeRecipients(
    parseManualRecipients(manualRecipients),
    Array.isArray(uploadedRecipients) ? uploadedRecipients : []
  );

  if (invalidRecipients.length > 0) {
    return response.status(400).json({
      ok: false,
      message: "Some email addresses are invalid.",
      invalidRecipients
    });
  }

  if (validRecipients.length === 0) {
    return response.status(400).json({
      ok: false,
      message: "Add at least one recipient email."
    });
  }

  try {
    await connectToDatabase();

    const record = await EmailRecord.create({
      subject: trimmedSubject,
      body: trimmedBody,
      recipients: validRecipients,
      totalRecipients: validRecipients.length,
      status: "queued",
      uploadFileName
    });

    const result = await sendBulkEmail({
      recipients: validRecipients,
      subject: trimmedSubject,
      body: trimmedBody
    });

    record.acceptedRecipients = result.acceptedRecipients;
    record.failedRecipients = result.failedRecipients;
    record.status =
      result.failedRecipients.length === 0
        ? "success"
        : result.acceptedRecipients.length > 0
          ? "partial"
          : "failed";

    await record.save();

    return response.status(200).json({
      ok: true,
      message:
        record.status === "success"
          ? `Email sent to ${result.acceptedRecipients.length} recipients.`
          : `Sent to ${result.acceptedRecipients.length} recipients, ${result.failedRecipients.length} failed.`,
      record
    });
  } catch (error) {
    console.error("Bulk send failed", error);

    try {
      await EmailRecord.create({
        subject: trimmedSubject,
        body: trimmedBody,
        recipients: validRecipients,
        totalRecipients: validRecipients.length,
        status: "failed",
        uploadFileName,
        errorMessage: error.message
      });
    } catch (recordError) {
      console.error("Could not store failed record", recordError);
    }

    return response.status(500).json({
      ok: false,
      message: "Bulk email sending failed.",
      error: error.message
    });
  }
});

module.exports = app;
