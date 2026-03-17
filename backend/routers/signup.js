const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const router = express.Router();

// Sign Up Route
router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, email, password, dateOfBirth, city } = req.body;

    // Check for missing fields
    if (!firstName || !lastName || !email || !password || !dateOfBirth || !city) {
      return res.status(400).send({ message: "All fields are required" });
    }

    // Validate first and last name (only letters, min 3 chars)
    const nameRegex = /^[A-Za-z]{3,}$/;
    if (!nameRegex.test(firstName)) {
      return res.status(400).send({
        message: "First name must be at least 3 letters and contain only letters",
      });
    }
    if (!nameRegex.test(lastName)) {
      return res.status(400).send({
        message: "Last name must be at least 3 letters and contain only letters",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).send({ message: "Please provide a valid email address" });
    }

    // Validate password (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).send({
        message:
          "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one number",
      });
    }

    // Validate age (must be 18+)
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 18) {
      return res.status(400).send({ message: "You must be at least 18 years old to sign up" });
    }

    // Check if email is already in use
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send({ message: "Email already in use" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save new user
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      dateOfBirth,
      city,
    });

    await user.save();
    res.status(201).send({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error during sign up:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

module.exports = router;