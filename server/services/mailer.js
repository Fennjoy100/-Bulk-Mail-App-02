const nodemailer = require("nodemailer");

function chunkArray(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD are required.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    auth: {
      user,
      pass
    }
  });
}

async function sendBulkEmail({ recipients, subject, body }) {
  const transporter = createTransporter();
  const fromName = process.env.EMAIL_FROM_NAME || "BulkMail Studio";
  const fromAddress = process.env.GMAIL_USER;
  const batchSize = Number(process.env.EMAIL_BATCH_SIZE || 25);
  const acceptedRecipients = [];
  const failedRecipients = [];
  const htmlBody = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");

  for (const recipientBatch of chunkArray(recipients, batchSize)) {
    try {
      await transporter.sendMail({
        from: `"${fromName}" <${fromAddress}>`,
        to: fromAddress,
        bcc: recipientBatch,
        subject,
        text: body,
        html: htmlBody
      });

      acceptedRecipients.push(...recipientBatch);
    } catch (error) {
      failedRecipients.push(...recipientBatch);
      console.error(
        `Failed to send mail batch: ${recipientBatch.join(", ")}`,
        error
      );
    }
  }

  return {
    acceptedRecipients,
    failedRecipients
  };
}

module.exports = {
  sendBulkEmail
};
