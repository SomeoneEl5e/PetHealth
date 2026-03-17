const express = require("express");
const router  = express.Router();
const Vaccine = require("../models/vaccine");

// GET /api/vaccines
// Optional query: ?petType=Dog
router.get("/", async (req, res) => {
  try {
    const { petType } = req.query;
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const base = { disabled: { $ne: true }, createdAt: { $lte: cutoff } };
    const filter = petType ? { ...base, PetType: petType } : base;
    const list = await Vaccine.find(filter).sort({ Name: 1 });
    res.json(list);
  } catch (err) {
    console.error("GET /api/vaccines error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;