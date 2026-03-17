const mongoose = require("mongoose");
const petSchema = require("./pets.js");

const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "First name is required"],
    trim: true,
    minlength: [3, "First name must be at least 3 characters long"],
    match: [/^[A-Za-z]+$/, "First name must contain only letters"],
  },
  lastName: {
    type: String,
    required: [true, "Last name is required"],
    trim: true,
    minlength: [3, "Last name must be at least 3 characters long"],
    match: [/^[A-Za-z]+$/, "Last name must contain only letters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [8, "Password must be at least 8 characters long"],
    validate: {
      validator: function (v) {
        return /[A-Z]/.test(v) && /[a-z]/.test(v) && /\d/.test(v);
      },
      message: "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    },
  },
  dateOfBirth: {
    type: String,
    required: [true, "Date of birth is required"],
    validate: {
      validator: function (v) {
        const [day, month, year] = v.split("-");
        const birthDate = new Date(`${year}-${month}-${day}`);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        return age >= 18;
      },
      message: "You must be at least 18 years old to sign up",
    },
  },
  city: {
    type: String,
    trim: true,
    default: "",
  },
  role: { type: String, enum: ["user", "editor", "sub-admin", "admin"], default: "user" },
  pets: { type: [petSchema], default: [] }
}, { timestamps: true }
));

module.exports = User;
