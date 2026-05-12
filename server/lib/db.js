const mongoose = require("mongoose");

let cachedConnection = null;

async function connectToDatabase() {
  const connectionString = process.env.MONGODB_URI;

  if (!connectionString) {
    throw new Error("MONGODB_URI is not configured.");
  }

  if (cachedConnection) {
    return cachedConnection;
  }

  cachedConnection = await mongoose.connect(connectionString, {
    dbName: process.env.MONGODB_DB_NAME || "bulk-mail-app"
  });

  return cachedConnection;
}

module.exports = {
  connectToDatabase
};
