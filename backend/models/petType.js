/**
 * PetType Model
 * -------------
 * Master list of pet types (e.g., "Dog", "Cat", "Bird").
 * Used as a lookup for pet registration and breed validation.
 *
 * Management features:
 * - Unique pet type names enforced at database level
 * - Soft-delete via `disabled` flag
 * - Tracks creator and creation time for 24-hour edit window
 * - New types are hidden from public API for 24 hours (pending review)
 */
const mongoose = require("mongoose");

const petTypeSchema = new mongoose.Schema({
  // The pet type name (must be unique, e.g., "Dog", "Cat")
  petType: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  // Soft-delete — disabled types are hidden from public endpoints
  disabled: {
    type: Boolean,
    default: false
  },
  // Staff member who created this type
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  // Creation timestamp — used for 24-hour edit/delete window
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: "petTypes"
});

module.exports = mongoose.model("PetType", petTypeSchema);
