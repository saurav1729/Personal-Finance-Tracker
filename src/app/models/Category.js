// models/Category.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
});

categorySchema.index({ userId: 1 }); // Index on userId for performance

module.exports = mongoose.models.Category || mongoose.model('Category', categorySchema);
