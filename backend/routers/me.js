const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const router = express.Router();

// Auth middleware
router.use((req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = userId;
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
});

// GET own profile
router.get("/", async (req, res) => {
  try {
    const user = await User.findById(req.userId, "firstName lastName email dateOfBirth city");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// PUT update own profile
router.put("/", async (req, res) => {
  try {
    const { firstName, lastName, email, dateOfBirth, city, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (city) user.city = city;

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ message: "Current password is required" });
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();
    res.json({ firstName: user.firstName, lastName: user.lastName, email: user.email, dateOfBirth: user.dateOfBirth, city: user.city });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: "Email already in use" });
    if (err.errors) {
      const msg = Object.values(err.errors).map(e => e.message).join(", ");
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
