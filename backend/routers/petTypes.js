/**
 * Pet Types Router (Public)
 * -------------------------
 * GET /api/petTypes
 *
 * Returns all active (non-disabled) pet types that have existed for
 * at least 24 hours. The 24-hour delay acts as a "pending review" window
 * so newly added types don't immediately appear to end users.
 *
 * No authentication required — used by the signup and add-pet forms.
 */
const express = require("express");
const PetType = require("../models/petType");
const router  = express.Router();

// GET /api/petTypes — Public list of approved pet types
router.get("/", async (req, res) => {
  try {
    // Only return types created more than 24 hours ago AND not disabled
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const types = await PetType.find({ createdAt: { $lte: cutoff }, disabled: { $ne: true } });
    res.json(types);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
