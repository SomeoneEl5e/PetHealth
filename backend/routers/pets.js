const express  = require("express");
const jwt      = require("jsonwebtoken");
const multer   = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const User     = require("../models/user");
const Pet      = require('../models/pets');
const router   = express.Router();

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// auth middleware: expects header "Authorization: Bearer <token>"
router.use((req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token  = header.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = userId;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Unauthorized" });
  }
});

// multer + Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "pethealth",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    transformation: [{ width: 500, height: 500, crop: "limit", quality: "auto" }]
  }
});
const upload = multer({ storage });

// GET this user’s pets (from the embedded array)
router.get("/", async (req, res) => {
  try {
    const user = await User.findById(req.userId, "pets");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.pets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST pet with photo
router.post("/", upload.single("photo"), async (req, res) => {
  try {
    console.log('BODY:', req.body);
    console.log('FILE:', req.file);

    const { name, type, breed, birthDate, gender } = req.body;
    if (!name || !type || !breed || !birthDate || !gender) {
      console.log("Missing required fields:", req.body);
      return res.status(400).json({ error: "Missing required fields" });
    }

    let photoUrl = "";
    if (req.file) {
      photoUrl = req.file.path;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      console.log("User not found for userId:", req.userId);
      return res.status(404).json({ message: "User not found" });
    }

    user.pets.push({
      name,
      type,
      breed,
      birthDate,
      gender,
      photoUrl
    });

    await user.save();
    res.json(user.pets);
  } catch (err) {
    console.error('Add pet error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/pets/:petId — edit pet details
router.put("/:petId", upload.single("photo"), async (req, res) => {
  try {
    const { petId } = req.params;
    const { name, type, breed, birthDate, gender } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const pet = user.pets.id(petId);
    if (!pet) return res.status(404).json({ message: "Pet not found" });

    if (name) pet.name = name;
    if (type) pet.type = type;
    if (breed) pet.breed = breed;
    if (birthDate) pet.birthDate = birthDate;
    if (gender) pet.gender = gender;
    if (req.file) pet.photoUrl = req.file.path;

    await user.save();
    res.json(user.pets);
  } catch (err) {
    console.error(`PUT /api/pets/${req.params.petId} error:`, err);
    res.status(500).json({ message: "Could not update pet" });
  }
});

// DELETE /api/pets/:petId
// Returns the updated pets array after deletion
router.delete("/:petId", async (req, res) => {
  try {
    const { petId } = req.params;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // find subdoc by its _id and remove it
    const petSubdoc = user.pets.id(petId);
    if (!petSubdoc) {
      return res.status(404).json({ message: "Pet not found" });
    }
    await petSubdoc.deleteOne(); // Properly deletes the subdocument in Mongoose 6+
    await user.save();  // write the change back to Mongo

    // return the updated array
    res.json(user.pets);
  } catch (err) {
    console.error(`DELETE /api/pets/${req.params.petId} error:`, err);
    res.status(500).json({ message: "Could not delete pet" });
  }
});

// POST /api/pets/:petId/visits - Add a vet visit
router.post("/:petId/visits", async (req, res) => {
  try {
    const { petId } = req.params;
    const { date, veterinarian, reason, notes, clinicAddress } = req.body;

    if (!date || !reason || !clinicAddress) {
      return res.status(400).json({ message: "Missing required fields: date, reason, and clinicAddress" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const pet = user.pets.id(petId);
    if (!pet) return res.status(404).json({ message: "Pet not found" });

    // Add visit to pet's vetVisits array
    pet.vetVisits.push({
      date: new Date(date),
      reason,
      veterinarian,
      clinicAddress: clinicAddress || "",
      vetNotes: notes || ""
    });

    await user.save();
    res.json(user.pets);
  } catch (err) {
    console.error("Error adding visit:", err);
    res.status(500).json({ message: "Could not add visit" });
  }
});

// POST /api/pets/:petId/vaccines - Add a vaccine
router.post("/:petId/vaccines", async (req, res) => {
  try {
    const { petId } = req.params;
    const { date, vaccineName, veterinarian, clinicAddress, notes } = req.body;

    if (!date || !vaccineName) {
      return res.status(400).json({ message: "Missing required fields: date and vaccineName" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const pet = user.pets.id(petId);
    if (!pet) return res.status(404).json({ message: "Pet not found" });

    // Add vaccine to pet's vaccines array
    pet.vaccines.push({
      date: new Date(date),
      vaccineName,
      veterinarian: veterinarian || "",
      clinicAddress: clinicAddress || "",
      vetNotes: notes || ""
    });

    await user.save();
    res.json(user.pets);
  } catch (err) {
    console.error("Error adding vaccine:", err);
    res.status(500).json({ message: "Could not add vaccine" });
  }
});

// PUT /api/pets/:petId/visits/:visitId - Edit a vet visit
router.put("/:petId/visits/:visitId", async (req, res) => {
  try {
    const { petId, visitId } = req.params;
    const { date, veterinarian, reason, notes, clinicAddress } = req.body;

    if (!date || !reason || !clinicAddress) {
      return res.status(400).json({ message: "Missing required fields: date, reason, and clinicAddress" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const pet = user.pets.id(petId);
    if (!pet) return res.status(404).json({ message: "Pet not found" });

    const visit = pet.vetVisits.id(visitId);
    if (!visit) return res.status(404).json({ message: "Visit not found" });

    // Update visit fields
    visit.date = new Date(date);
    visit.reason = reason;
    visit.veterinarian = veterinarian || "";
    visit.clinicAddress = clinicAddress || "";
    visit.vetNotes = notes || "";

    await user.save();
    res.json(user.pets);
  } catch (err) {
    console.error("Error editing visit:", err);
    res.status(500).json({ message: "Could not edit visit" });
  }
});

// DELETE /api/pets/:petId/visits/:visitId - Delete a vet visit
router.delete("/:petId/visits/:visitId", async (req, res) => {
  try {
    const { petId, visitId } = req.params;

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const pet = user.pets.id(petId);
    if (!pet) return res.status(404).json({ message: "Pet not found" });

    const visit = pet.vetVisits.id(visitId);
    if (!visit) return res.status(404).json({ message: "Visit not found" });

    await visit.deleteOne();
    await user.save();
    res.json(user.pets);
  } catch (err) {
    console.error("Error deleting visit:", err);
    res.status(500).json({ message: "Could not delete visit" });
  }
});

module.exports = router;