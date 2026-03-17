const express = require("express");
const PetType = require("../models/petType");
const router  = express.Router();

router.get("/", async (req, res) => {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const types = await PetType.find({ createdAt: { $lte: cutoff }, disabled: { $ne: true } });
    res.json(types);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
