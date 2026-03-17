// backend/models/breed.js
const mongoose = require("mongoose");
const PetType = require("./petType");

const breedSchema = new mongoose.Schema({
  breed: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    trim: true,
    
    validate: {
      isAsync: true,
      validator: async function(val) {
        const exists = await PetType.exists({ petType: val });
        return !!exists;
      },
      message: props => `"${props.value}" is not a valid pet type.`,
    },
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
  },
});

module.exports = mongoose.model("Breed", breedSchema);
