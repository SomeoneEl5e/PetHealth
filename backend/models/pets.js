const mongoose = require("mongoose");

const petSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  type:      { type: String, required: true, trim: true },
  breed:     { type: String, required: true, trim: true },
  birthDate: { type: Date,   required: true },
  gender:    { type: String, enum: ["Male", "Female"], required: true },
  photoUrl:  { type: String, default: "" },
  owner:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
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
}, { timestamps: true });

module.exports = petSchema;
