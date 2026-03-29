/**
 * Signup Router
 * -------------
 * POST /api/signup
 *
 * Handles new user registration with comprehensive validation:
 * 1. All required fields must be present
 * 2. Name validation: letters only, min 3 characters
 * 3. Email format validation + uniqueness check
 * 4. Password strength: min 8 chars, uppercase + lowercase + number
 * 5. Age verification: must be 18 or older
 *
 * The password is hashed with bcrypt (salt rounds = 10) before storage.
 * New users are assigned the default role of "user".
 */
const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const router = express.Router();

// POST /api/signup — Register a new user account
router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, email, password, dateOfBirth, city } = req.body;

    // ── Step 1: Check all required fields are provided ──
    if (!firstName || !lastName || !email || !password || !dateOfBirth || !city) {
      return res.status(400).send({ message: "All fields are required" });
    }

    // ── Step 2: Validate first and last name (only letters, min 3 chars) ──
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

    // ── Step 3: Validate email format ──
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).send({ message: "Please provide a valid email address" });
    }

    // ── Step 4: Validate password strength ──
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).send({
        message:
          "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one number",
      });
    }

    // ── Step 5: Validate minimum age (18+) ──
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 18) {
      return res.status(400).send({ message: "You must be at least 18 years old to sign up" });
    }

    // ── Step 6: Check email uniqueness ──
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send({ message: "Email already in use" });
    }

    // ── Step 7: Hash the password and create the user ──
    const hashedPassword = await bcrypt.hash(password, 10);

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