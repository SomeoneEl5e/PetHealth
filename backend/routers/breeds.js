/**
 * Breeds Router (Public)
 * ----------------------
 * GET /api/breeds
 *
 * Returns all active (non-disabled) breeds that have existed for
 * at least 24 hours. Same pending-review window as pet types.
 *
 * No authentication required — used by the add-pet form for breed selection.
 */
const express = require("express");
const Breed = require("../models/breed");
const router = express.Router();

// GET /api/breeds — Public list of approved breeds
router.get("/", async (req, res) => {
  try {
    // Only return breeds created more than 24 hours ago AND not disabled
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const all = await Breed.find({ createdAt: { $lte: cutoff }, disabled: { $ne: true } });
    res.json(all);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

