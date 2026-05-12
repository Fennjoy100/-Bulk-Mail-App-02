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

function getBatchSize() {
  const parsed = Number(process.env.EMAIL_BATCH_SIZE || 50);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 50;
  }

  return Math.min(parsed, 50);
}

async function createResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required.");
  }

  const { Resend } = await import("resend");
  return new Resend(apiKey);
}

async function sendBulkEmail({ recipients, subject, body }) {
  const resend = await createResendClient();
  const fromName = process.env.EMAIL_FROM_NAME || "BulkMail Studio";
  const fromAddress = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const replyTo = process.env.REPLY_TO_EMAIL || undefined;
  const batchSize = getBatchSize();
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
      const { error } = await resend.emails.send({
        from: `"${fromName}" <${fromAddress}>`,
        to: [fromAddress],
        bcc: recipientBatch,
        subject,
        text: body,
        html: htmlBody,
        replyTo
      });

      if (error) {
        throw new Error(error.message || "Resend failed to send email.");
      }

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
