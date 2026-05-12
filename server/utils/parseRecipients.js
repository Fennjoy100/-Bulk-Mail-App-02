function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseManualRecipients(input) {
  if (!input) {
    return [];
  }

  return String(input)
    .split(/[\n,;]+/)
    .map(normalizeEmail)
    .filter(Boolean);
}

function mergeRecipients(...groups) {
  const uniqueRecipients = Array.from(
    new Set(groups.flat().map(normalizeEmail).filter(Boolean))
  );

  const invalidRecipients = uniqueRecipients.filter(
    (email) => !isValidEmail(email)
  );

  const validRecipients = uniqueRecipients.filter((email) =>
    isValidEmail(email)
  );

  return {
    validRecipients,
    invalidRecipients
  };
}

module.exports = {
  parseManualRecipients,
  mergeRecipients
};
