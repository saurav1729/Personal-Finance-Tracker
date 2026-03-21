// app/models/SavingGoal.js
import mongoose from "mongoose"

const AllocationSchema = new mongoose.Schema({
    amount: { type: Number, required: true },
    direction: { type: String, enum: ["add", "withdraw"], default: "add" },
    note: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
}, { _id: false })

const SavingGoalSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
    deadline: { type: Date, default: null },
    disabled: { type: Boolean, default: false },
    status: { type: String, default: "active" },
    // ✅ Tracks every add/withdraw — history of fund movements
    allocations: { type: [AllocationSchema], default: [] },
}, { timestamps: true })

export default mongoose.models.SavingGoal ||
    mongoose.model("SavingGoal", SavingGoalSchema)