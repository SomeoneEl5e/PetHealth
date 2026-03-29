/**
 * Vaccine Model (Master List)
 * ---------------------------
 * Defines the available vaccine types that can be administered to pets.
 * This is NOT a record of individual vaccinations — those are stored
 * inside each pet's `vaccines` array in the User document.
 *
 * Key fields:
 * - Name: vaccine name (e.g., "Rabies", "DHPP")
 * - Timing: recommended interval in months between doses
 * - PetType: array of pet types this vaccine applies to (e.g., ["Dog", "Cat"])
 */
const mongoose = require("mongoose");

const vaccineSchema = new mongoose.Schema({
  // Vaccine name (e.g., "Rabies", "Bordetella")
  Name: {
    type: String,
    required: true,
    trim: true
  },
  // Recommended interval between doses, in months
  Timing: {
    type: Number,
    required: true
  },
  // Which pet types this vaccine is applicable to
  PetType: {
    type: [String],
    required: true
  },
  // Soft-delete — disabled vaccines are hidden from public endpoints
  disabled: {
    type: Boolean,
    default: false
  },
  // Staff member who created this vaccine type
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
  collection: "vaccines"
});

module.exports = mongoose.model("Vaccine", vaccineSchema);
