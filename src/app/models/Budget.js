const mongoose = require("mongoose")

const budgetSchema = new mongoose.Schema({
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  spent: { type: String, required: true },
  status: {
    type: String,
    required: true,
    default: "enabled", // Add a default value
    enum: ["enabled", "disabled"], // Restrict to valid values
  },
  userId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
})

budgetSchema.index({ userId: 1 })

// Clear the model cache if it exists to prevent OverwriteModelError
mongoose.models = {}

module.exports = mongoose.models.Budget || mongoose.model("Budget", budgetSchema)
