/**
 * ActivityLog Model
 * ------------------
 * Records every management action performed by staff (editors, sub-admins, admins).
 * Used for audit trails and the Activity Statistics dashboard.
 *
 * Each log entry captures WHO did WHAT to WHICH resource and WHEN.
 */
const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  // Reference to the staff member who performed the action
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  // The type of action performed
  action:     { type: String, enum: ["add", "edit", "delete", "enable", "disable"], required: true },
  // The resource type that was affected
  target:     { type: String, enum: ["vaccine", "petType", "breed"], required: true },
  // Human-readable name of the affected item (e.g., "Rabies", "Dog")
  targetName: { type: String, default: "" },
  // When the action occurred
  timestamp:  { type: Date, default: Date.now }
}, { collection: "activityLogs" });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
