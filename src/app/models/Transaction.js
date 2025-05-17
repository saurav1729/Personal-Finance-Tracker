const mongoose = require("mongoose")

const transactionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
    default: "No description provided", // Add a default value
  },
  type: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
})

transactionSchema.index({ userId: 1 }) // Index on userId for performance
transactionSchema.index({ categoryId: 1 }) // Index on categoryId

// Clear the model cache if it exists to prevent OverwriteModelError
mongoose.models = {}

module.exports = mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema)
