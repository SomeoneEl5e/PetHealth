const mongoose = require("mongoose");

const vaccineSchema = new mongoose.Schema({
  Name: {
    type: String,
    required: true,
    trim: true
  },
  Timing: {
    type: Number,
    required: true
  },
  PetType: {
    type: [String],
    required: true
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
  collection: "vaccines"
});

module.exports = mongoose.model("Vaccine", vaccineSchema);
