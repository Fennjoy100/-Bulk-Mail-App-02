const nodemailer = require("nodemailer");

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
  const acceptedRecipients = [];
  const failedRecipients = [];

  for (const recipient of recipients) {
    try {
      await transporter.sendMail({
        from: `"${fromName}" <${fromAddress}>`,
        to: recipient,
        subject,
        text: body,
        html: body
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => `<p>${escapeHtml(line)}</p>`)
          .join("")
      });

      acceptedRecipients.push(recipient);
    } catch (error) {
      failedRecipients.push(recipient);
      console.error(`Failed to send mail to ${recipient}`, error);
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
