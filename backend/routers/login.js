/**
 * Login Router
 * ------------
 * POST /api/login
 *
 * Authenticates a user by email and password.
 * On success, returns a JWT token (valid for 1 hour) along with
 * basic user info (id, name, email, role) for the frontend to store in session.
 *
 * Uses bcrypt to compare the hashed password stored in the database.
 * Returns a generic error message for both wrong email and wrong password
 * to prevent user enumeration attacks.
 */
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const router = express.Router();

// POST /api/login — Authenticate user and issue JWT
router.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Look up user by email (case-insensitive due to model lowercase)
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Verify password against stored bcrypt hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT with user ID and email as payload
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }  // Token expires after 1 hour
    );

    // Return token and user profile data for frontend session storage
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role || "user",
      },
    });

  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;