import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "assistant", "system", "tool"], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  name: { type: String }, // For tool names
  tool_call_id: { type: String }
});

const ChatSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  messages: [MessageSchema],
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp on save
ChatSessionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.ChatSession || mongoose.model("ChatSession", ChatSessionSchema);
