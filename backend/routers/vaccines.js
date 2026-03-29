/**
 * Vaccines Router (Public)
 * ------------------------
 * GET /api/vaccines
 *
 * Returns the master list of available vaccine types.
 * Optionally filtered by pet type via query parameter: ?petType=Dog
 *
 * Only returns active (non-disabled) vaccines that have existed for 24+ hours.
 * Used by the AddVaccineForm to show available vaccines for a given pet type.
 */
const express = require("express");
const router  = express.Router();
const Vaccine = require("../models/vaccine");

// GET /api/vaccines — Public list of approved vaccines
// Optional query: ?petType=Dog (filters to vaccines applicable for that type)
router.get("/", async (req, res) => {
  try {
    const { petType } = req.query;
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    // Base filter: not disabled and older than 24 hours
    const base = { disabled: { $ne: true }, createdAt: { $lte: cutoff } };
    // If petType is specified, also filter by the PetType array field
    const filter = petType ? { ...base, PetType: petType } : base;
    const list = await Vaccine.find(filter).sort({ Name: 1 });
    res.json(list);
  } catch (err) {
    console.error("GET /api/vaccines error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;