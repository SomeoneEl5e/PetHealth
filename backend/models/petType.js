const mongoose = require("mongoose");

const petTypeSchema = new mongoose.Schema({
  petType: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: "petTypes"
});

module.exports = mongoose.model("PetType", petTypeSchema);
