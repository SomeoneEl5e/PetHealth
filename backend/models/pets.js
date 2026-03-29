/**
 * Pet Schema (Subdocument)
 * -----------------------
 * Defines the shape of a pet embedded within a User document.
 * Pets are NOT stored in a separate collection — they live inside
 * the User's `pets` array as subdocuments.
 *
 * Each pet contains:
 * - Basic info: name, type, breed, birthDate, gender, photo
 * - Vet visit history (vetVisits array)
 * - Vaccination records (vaccines array)
 */
const mongoose = require("mongoose");

const petSchema = new mongoose.Schema({
  // ─── Basic Pet Information ───
  name:      { type: String, required: true, trim: true },
  type:      { type: String, required: true, trim: true },   // e.g., "Dog", "Cat"
  breed:     { type: String, required: true, trim: true },   // e.g., "Labrador", "Mixed"
  birthDate: { type: Date,   required: true },
  gender:    { type: String, enum: ["Male", "Female"], required: true },
  photoUrl:  { type: String, default: "" },                  // Cloudinary URL
  owner:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  // ─── Vet Visit History ───
  // Each visit records the date, reason, vet info, and any clinical notes
  vetVisits: {
    type: [
      {
        date:          { type: Date,   required: true },
        reason:        { type: String, required: true, trim: true },
        veterinarian:  { type: String, default: "" },
        clinicAddress: { type: String, default: "" },
        vetNotes:      { type: String, default: "" }
      }
    ], default: []
  },
  // ─── Vaccination Records ───
  // Each record links to a vaccine name from the master vaccine list
  vaccines: {
    type: [
      {
        date:          { type: Date,   required: true },
        vaccineName:   { type: String, required: true, trim: true },
        veterinarian:  { type: String, default: "" },
        clinicAddress: { type: String, default: "" },
        vetNotes:      { type: String, default: "" }
      }
    ], default: []
  }
}, { timestamps: true });  // Adds createdAt and updatedAt automatically

module.exports = petSchema;
