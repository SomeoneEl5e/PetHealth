/**
 * Breed Model
 * -----------
 * Represents an animal breed (e.g., "Golden Retriever" for Dogs).
 * Each breed is linked to a PetType via an async validator that verifies
 * the pet type exists in the database before saving.
 *
 * Management features:
 * - Can be disabled (soft-delete) by editors/admins
 * - Tracks who created it and when (for 24-hour edit window enforcement)
 */
const mongoose = require("mongoose");
const PetType = require("./petType");

const breedSchema = new mongoose.Schema({
  // The breed name (e.g., "Labrador", "Persian")
  breed: {
    type: String,
    required: true,
    trim: true,
  },
  // The parent pet type — validated against the PetType collection
  type: {
    type: String,
    required: true,
    trim: true,
    
    validate: {
      isAsync: true,
      validator: async function(val) {
        // Ensure the referenced pet type actually exists in the database
        const exists = await PetType.exists({ petType: val });
        return !!exists;
      },
      message: props => `"${props.value}" is not a valid pet type.`,
    },
  },
  // Soft-delete flag — disabled breeds are hidden from public endpoints
  disabled: {
    type: Boolean,
    default: false
  },
  // The staff member who created this breed (used for editor permission checks)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  // Creation timestamp (used for 24-hour edit/delete window)
  createdAt: {
    type: Date,
    default: Date.now
  },
});

module.exports = mongoose.model("Breed", breedSchema);
