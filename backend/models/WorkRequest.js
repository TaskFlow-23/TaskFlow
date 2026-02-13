const mongoose = require("mongoose");

const workRequestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ["OPEN", "IN_PROGRESS", "DONE"],
    default: "OPEN",
  },
  priority: {
    type: String,
    enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
    default: "LOW",
  },
  assignedAgent: {
    type: String,
    default: null,
  },
  tags: [String],
  dueDate: Date,
  createdDate: {
    type: Date,
    default: Date.now,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model("WorkRequest", workRequestSchema);
