const mongoose = require("mongoose")

const rawInputSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  file_hash: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    required: true,
    enum: ["pending", "processed", "failed"],
    default: "pending"
  },
  upload_date: {
    type: Date,
    default: Date.now,
  },
  raw_data_dump: {
    type: String, // Can store stringified JSON or base64
    required: false
  }
})

rawInputSchema.index({ userId: 1 })

// Clear the model cache if it exists to prevent OverwriteModelError
mongoose.models = {}

module.exports = mongoose.models.RawInput || mongoose.model("RawInput", rawInputSchema)
