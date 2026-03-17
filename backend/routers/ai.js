const express = require("express");
const jwt = require("jsonwebtoken");
const OpenAI = require("openai");
const User = require("../models/user");
const Vaccine = require("../models/vaccine");

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

// POST /api/ai/pet-summary
router.post("/pet-summary", async (req, res) => {
  try {
    const { petId } = req.body;
    if (!petId) return res.status(400).json({ message: "petId is required" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const pet = user.pets.id(petId);
    if (!pet) return res.status(404).json({ message: "Pet not found" });

    // Gather available vaccines for this pet type
    const availableVaccines = await Vaccine.find({
      PetType: pet.type,
      disabled: { $ne: true }
    }).lean();

    const ageYears = ((Date.now() - new Date(pet.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)).toFixed(1);

    const visitsSummary = pet.vetVisits.length
      ? pet.vetVisits
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .map(v => `- ${new Date(v.date).toLocaleDateString()}: ${v.reason}${v.vetNotes ? ` (Notes: ${v.vetNotes})` : ""}${v.veterinarian ? ` [Vet: ${v.veterinarian}]` : ""}`)
          .join("\n")
      : "No vet visits recorded.";

    const vaccinesSummary = pet.vaccines.length
      ? pet.vaccines
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .map(v => `- ${new Date(v.date).toLocaleDateString()}: ${v.vaccineName}`)
          .join("\n")
      : "No vaccines recorded.";

    const availableVaccinesList = availableVaccines.length
      ? availableVaccines.map(v => `- ${v.Name} (every ${v.Timing} months)`).join("\n")
      : "No vaccines defined for this pet type.";

    const prompt = `You are a veterinary health assistant. Analyze the following pet's data and provide:

1. **Health Summary** – A brief overview of the pet's current health status based on visit history and vaccinations.
2. **Upcoming Vaccines** – Which vaccines are due or overdue, based on the pet's vaccine history and the recommended schedule.
3. **Recommended Next Appointments** – Suggest when the next vet visit should be and why, based on the visit history patterns and the pet's age.
4. **Health Tips** – 2-3 practical tips specific to this pet's breed, age, and history.

Pet Information:
- Name: ${pet.name}
- Type: ${pet.type}
- Breed: ${pet.breed}
- Age: ${ageYears} years
- Gender: ${pet.gender}

Vet Visit History:
${visitsSummary}

Vaccination History:
${vaccinesSummary}

Available Vaccines for ${pet.type} (with recommended interval):
${availableVaccinesList}

Today's date: ${new Date().toLocaleDateString()}

Please be concise and practical. Use markdown formatting with headers.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const summary = completion.choices[0].message.content;
    res.json({ summary });
  } catch (err) {
    console.error("AI summary error:", err);
    if (err.status === 401 || err.code === "invalid_api_key") {
      return res.status(503).json({ message: "AI service not configured. Please set a valid OpenAI API key." });
    }
    if (err.status === 429 || err.code === "insufficient_quota") {
      return res.status(503).json({ message: "OpenAI quota exceeded. Please add credits to your OpenAI account." });
    }
    res.status(500).json({ message: "Failed to generate summary" });
  }
});

module.exports = router;
