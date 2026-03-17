const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action:     { type: String, enum: ["add", "edit", "delete", "enable", "disable"], required: true },
  target:     { type: String, enum: ["vaccine", "petType", "breed"], required: true },
  targetName: { type: String, default: "" },
  timestamp:  { type: Date, default: Date.now }
}, { collection: "activityLogs" });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
