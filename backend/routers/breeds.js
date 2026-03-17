const express = require("express");
const Breed = require("../models/breed");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const all = await Breed.find({ createdAt: { $lte: cutoff }, disabled: { $ne: true } });
    res.json(all);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

