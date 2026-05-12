const mongoose = require("mongoose");

const emailRecordSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true
    },
    body: {
      type: String,
      required: true
    },
    recipients: {
      type: [String],
      required: true
    },
    totalRecipients: {
      type: Number,
      required: true
    },
    acceptedRecipients: {
      type: [String],
      default: []
    },
    failedRecipients: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ["queued", "success", "partial", "failed"],
      default: "queued"
    },
    uploadFileName: {
      type: String,
      default: ""
    },
    errorMessage: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.EmailRecord ||
  mongoose.model("EmailRecord", emailRecordSchema);
