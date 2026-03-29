/**
 * Admin Router — Management Dashboard API
 * ========================================
 * Prefix: /api/admin
 *
 * Provides CRUD operations for the management dashboard, including:
 * - Vaccine Types: create, edit, toggle enable/disable, delete
 * - Pet Types: create, edit, toggle enable/disable, delete
 * - Breeds: create, edit, toggle enable/disable, delete
 * - Users: view, edit, delete, reset password, pass admin role
 * - Summary: overview of all users and their pets
 * - Statistics: population-level analytics with filtering
 * - Activity Stats: staff action audit trail
 *
 * Access Control:
 * - All routes require JWT authentication
 * - Minimum role required: "editor" (enforced by middleware)
 * - Editor: can only modify own items within 24 hours of creation
 * - Sub-admin: can view all users except admins, and statistics
 * - Admin: full access to all management features
 *
 * Every create/edit/delete/toggle action is logged to the ActivityLog
 * collection for audit trail purposes.
 */
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Vaccine = require("../models/vaccine");
const PetType = require("../models/petType");
const Breed = require("../models/breed");
const ActivityLog = require("../models/activityLog");
const router = express.Router();

// Roles that can access the admin panel
const MANAGE_ROLES = ["editor", "sub-admin", "admin"];
// Roles that can view user lists and statistics
const USER_VIEW_ROLES = ["sub-admin", "admin"];

/**
 * Helper: Fetch documents and enrich them with the creator's full name.
 * Maps each document's `createdBy` ObjectId to a human-readable name
 * by batch-querying the User collection. Returns plain JS objects.
 */
async function withCreator(query) {
  const docs = await query.lean();
  const ids = [...new Set(docs.map(d => d.createdBy).filter(Boolean).map(String))];
  const users = ids.length ? await User.find({ _id: { $in: ids } }, "firstName lastName").lean() : [];
  const map = {};
  users.forEach(u => { map[String(u._id)] = `${u.firstName} ${u.lastName}`; });
  return docs.map(d => ({ ...d, createdByName: d.createdBy ? (map[String(d.createdBy)] || "Unknown") : "Unknown" }));
}

// ─── Authentication Middleware ──────────────────────────────
// Verifies JWT, fetches the user's role, and requires at least "editor" role.
// Attaches req.userId and req.userRole for downstream route handlers.
router.use(async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(userId, "role");
    if (!user || !MANAGE_ROLES.includes(user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    req.userId = userId;
    req.userRole = user.role;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Unauthorized" });
  }
});

// ─── VACCINE TYPES ──────────────────────────────────────────
// CRUD operations for the master list of vaccine types.
// Editors can only modify their own items within 24 hours.
// All mutations are logged to ActivityLog.

// GET /api/admin/vaccines — Retrieve all vaccine types with creator names
router.get("/vaccines", async (req, res) => {
  try {
    const list = await withCreator(Vaccine.find().sort({ createdAt: -1 }));
    res.json(list);
  } catch (err) {
    console.error("GET /admin/vaccines error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/admin/vaccines — Create a new vaccine type
router.post("/vaccines", async (req, res) => {
  try {
    const { Name, Timing, PetType } = req.body;
    if (!Name || Timing == null || !PetType || !PetType.length) {
      return res.status(400).json({ message: "Name, Timing, and PetType are required" });
    }
    const existing = await Vaccine.findOne({ Name: Name.trim() });
    if (existing) {
      return res.status(400).json({ message: "Vaccine type already exists" });
    }
    await Vaccine.create({ Name: Name.trim(), Timing, PetType, createdBy: req.userId });
    await ActivityLog.create({ userId: req.userId, action: "add", target: "vaccine", targetName: Name.trim() });
    const list = await withCreator(Vaccine.find().sort({ createdAt: -1 }));
    res.json(list);
  } catch (err) {
    console.error("POST /admin/vaccines error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/admin/vaccines/:id — Edit a vaccine type (editor: own items within 24h only)
router.put("/vaccines/:id", async (req, res) => {
  try {
    const { Name, Timing, PetType } = req.body;
    if (!Name || Timing == null || !PetType || !PetType.length) {
      return res.status(400).json({ message: "Name, Timing, and PetType are required" });
    }
    const vaccine = await Vaccine.findById(req.params.id);
    if (!vaccine) return res.status(404).json({ message: "Vaccine not found" });
    // Editor: can only edit own items within 24 hours
    if (req.userRole === "editor") {
      if (!vaccine.createdBy || vaccine.createdBy.toString() !== req.userId) {
        return res.status(403).json({ message: "You can only edit items you created" });
      }
      if (Date.now() - new Date(vaccine.createdAt).getTime() > 24 * 60 * 60 * 1000) {
        return res.status(403).json({ message: "Edit window (24 hours) has expired" });
      }
    }
    vaccine.Name = Name.trim();
    vaccine.Timing = Timing;
    vaccine.PetType = PetType;
    await vaccine.save();
    await ActivityLog.create({ userId: req.userId, action: "edit", target: "vaccine", targetName: Name.trim() });
    const list = await withCreator(Vaccine.find().sort({ createdAt: -1 }));
    res.json(list);
  } catch (err) {
    console.error("PUT /admin/vaccines error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/admin/vaccines/:id/toggle — Toggle vaccine enabled/disabled state
router.patch("/vaccines/:id/toggle", async (req, res) => {
  try {
    const vaccine = await Vaccine.findById(req.params.id);
    if (!vaccine) return res.status(404).json({ message: "Vaccine not found" });
    // Editor: can only toggle own items within 24 hours
    if (req.userRole === "editor") {
      if (!vaccine.createdBy || vaccine.createdBy.toString() !== req.userId) {
        return res.status(403).json({ message: "You can only modify items you created" });
      }
      if (Date.now() - new Date(vaccine.createdAt).getTime() > 24 * 60 * 60 * 1000) {
        return res.status(403).json({ message: "Edit window (24 hours) has expired" });
      }
    }
    vaccine.disabled = !vaccine.disabled;
    await vaccine.save();
    await ActivityLog.create({ userId: req.userId, action: vaccine.disabled ? "disable" : "enable", target: "vaccine", targetName: vaccine.Name });
    const list = await withCreator(Vaccine.find().sort({ createdAt: -1 }));
    res.json(list);
  } catch (err) {
    console.error("PATCH /admin/vaccines/:id/toggle error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/admin/vaccines/:id — Delete a vaccine (only within 24h of creation)
router.delete("/vaccines/:id", async (req, res) => {
  try {
    const vaccine = await Vaccine.findById(req.params.id);
    if (!vaccine) return res.status(404).json({ message: "Vaccine not found" });
    if (Date.now() - new Date(vaccine.createdAt).getTime() > 24 * 60 * 60 * 1000) {
      return res.status(403).json({ message: "Can only delete vaccines within 24 hours of creation" });
    }
    if (req.userRole === "editor") {
      if (!vaccine.createdBy || vaccine.createdBy.toString() !== req.userId) {
        return res.status(403).json({ message: "You can only delete items you created" });
      }
    }
    await Vaccine.findByIdAndDelete(req.params.id);
    await ActivityLog.create({ userId: req.userId, action: "delete", target: "vaccine", targetName: vaccine.Name });
    const list = await withCreator(Vaccine.find().sort({ createdAt: -1 }));
    res.json(list);
  } catch (err) {
    console.error("DELETE /admin/vaccines/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── USERS ──────────────────────────────────────────────────
// User management endpoints (view/edit/delete/reset-password/pass-role).
// User viewing requires sub-admin or admin role.
// User editing/deleting requires admin role.

// GET /api/admin/users — List all users (sub-admin sees only other sub-admins)
router.get("/users", async (req, res) => {
  try {
    if (!USER_VIEW_ROLES.includes(req.userRole)) {
      return res.status(403).json({ message: "Access denied" });
    }
    let users = await User.find({}, "-password").sort({ firstName: 1 });
    // sub-admin sees all users except admins
    if (req.userRole === "sub-admin") {
      users = users.filter((u) => u.role !== "admin");
    }
    res.json(users);
  } catch (err) {
    console.error("GET /admin/users error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/admin/users/:id — Edit a user's profile/role (admin only)
// Enforces: max 1 admin, max 3 sub-admins, cannot change own role
router.put("/users/:id", async (req, res) => {
  try {
    if (req.userRole !== "admin") {
      return res.status(403).json({ message: "Only admin can edit users" });
    }
    const { firstName, lastName, email, role, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (role && ["user", "editor", "sub-admin", "admin"].includes(role) && role !== user.role) {
      // Admin cannot demote self — must use "Pass Admin" instead
      if (req.params.id === req.userId) {
        return res.status(400).json({ message: "Cannot change your own role. Use 'Pass Admin' instead." });
      }
      // Enforce max 1 admin
      if (role === "admin") {
        const adminCount = await User.countDocuments({ role: "admin", _id: { $ne: user._id } });
        if (adminCount >= 1) return res.status(400).json({ message: "Maximum 1 admin allowed" });
      }
      // Enforce max 3 sub-admins
      if (role === "sub-admin") {
        const subAdminCount = await User.countDocuments({ role: "sub-admin", _id: { $ne: user._id } });
        if (subAdminCount >= 3) return res.status(400).json({ message: "Maximum 3 sub-admins allowed" });
      }
      user.role = role;
    }
    if (password) user.password = await bcrypt.hash(password, 10);

    await user.save();
    const users = await User.find({}, "-password").sort({ firstName: 1 });
    res.json(users);
  } catch (err) {
    console.error("PUT /admin/users error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/admin/users/:id — Remove a user account (admin only, cannot delete self)
router.delete("/users/:id", async (req, res) => {
  try {
    if (req.userRole !== "admin") {
      return res.status(403).json({ message: "Only admin can delete users" });
    }
    if (req.params.id === req.userId) {
      return res.status(400).json({ message: "Cannot delete yourself" });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    await user.deleteOne();
    const users = await User.find({}, "-password").sort({ firstName: 1 });
    res.json(users);
  } catch (err) {
    console.error("DELETE /admin/users error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/admin/users/:id/reset-password — Reset a user's password
// Sub-admin can only reset other sub-admin passwords
router.post("/users/:id/reset-password", async (req, res) => {
  try {
    if (!USER_VIEW_ROLES.includes(req.userRole)) {
      return res.status(403).json({ message: "Access denied" });
    }
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: "Password is required" });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    // sub-admin cannot reset admin passwords
    if (req.userRole === "sub-admin" && user.role === "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    user.password = await bcrypt.hash(password, 10);
    await user.save();
    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("POST /admin/users/:id/reset-password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/admin/pass-role — Transfer admin role to another user
// Current admin is demoted to sub-admin; target is promoted to admin.
// Enforces maximum of 3 sub-admins (since current admin becomes one).
router.post("/pass-role", async (req, res) => {
  try {
    if (req.userRole !== "admin") {
      return res.status(403).json({ message: "Only admin can pass their role" });
    }
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ message: "Target user is required" });
    if (targetUserId === req.userId) {
      return res.status(400).json({ message: "Cannot pass role to yourself" });
    }
    const target = await User.findById(targetUserId);
    if (!target) return res.status(404).json({ message: "User not found" });

    // Enforce max 3 sub-admins (self will become sub-admin)
    const subAdminCount = await User.countDocuments({ role: "sub-admin", _id: { $ne: req.userId } });
    if (subAdminCount >= 3) {
      return res.status(400).json({ message: "Maximum 3 sub-admins reached. Cannot transfer role." });
    }

    // Promote target to admin
    target.role = "admin";
    await target.save();

    // Demote self to sub-admin
    const self = await User.findById(req.userId);
    self.role = "sub-admin";
    await self.save();

    res.json({ message: "Admin role transferred", newRole: "sub-admin" });
  } catch (err) {
    console.error("POST /admin/pass-role error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── SUMMARY ────────────────────────────────────────────────
// Flattened view of all users and their pets for overview tables.

// GET /api/admin/summary — List all pets with owner info
router.get("/summary", async (req, res) => {
  try {
    const users = await User.find({}, "-password").sort({ firstName: 1 });
    const summary = [];
    for (const user of users) {
      for (const pet of user.pets) {
        summary.push({
          ownerName: `${user.firstName} ${user.lastName}`,
          ownerEmail: user.email,
          petName: pet.name,
          petType: pet.type,
          petBreed: pet.breed,
          petGender: pet.gender,
          petBirthDate: pet.birthDate,
          visitsCount: pet.vetVisits ? pet.vetVisits.length : 0,
          vaccinesCount: pet.vaccines ? pet.vaccines.length : 0,
        });
      }
    }
    res.json(summary);
  } catch (err) {
    console.error("GET /admin/summary error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── STATISTICS ─────────────────────────────────────────────
// Population-level analytics with comprehensive filtering.
// Sub-admin and admin only.

// GET /api/admin/statistics/filters — Available filter options for the statistics dashboard
router.get("/statistics/filters", async (req, res) => {
  try {
    if (!USER_VIEW_ROLES.includes(req.userRole)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const users = await User.find({}, "city pets").lean();
    const allVaccineTypes = await Vaccine.find({}, "Name").lean();

    const citiesSet = new Set();
    const petTypesSet = new Set();
    const breedsMap = {}; // breed -> Set of pet types
    const vaccineNamesSet = new Set();

    for (const u of users) {
      if (u.city) citiesSet.add(u.city);
      for (const p of u.pets) {
        if (p.type) petTypesSet.add(p.type);
        if (p.breed) {
          if (!breedsMap[p.breed]) breedsMap[p.breed] = new Set();
          if (p.type) breedsMap[p.breed].add(p.type);
        }
        if (p.vaccines) {
          for (const v of p.vaccines) {
            if (v.vaccineName) vaccineNamesSet.add(v.vaccineName);
          }
        }
      }
    }

    // Also add system-defined vaccine type names
    for (const vt of allVaccineTypes) {
      vaccineNamesSet.add(vt.Name);
    }

    // Build breeds array with associated pet types
    const breeds = Object.entries(breedsMap)
      .map(([breed, types]) => ({ breed, petTypes: [...types].sort() }))
      .sort((a, b) => a.breed.localeCompare(b.breed));

    res.json({
      cities: [...citiesSet].sort(),
      petTypes: [...petTypesSet].sort(),
      breeds,
      vaccineNames: [...vaccineNamesSet].sort(),
      genders: ["Male", "Female"],
      ageGroups: ["< 1 year", "1-3 years", "3-5 years", "5-8 years", "8+ years"]
    });
  } catch (err) {
    console.error("GET /admin/statistics/filters error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Helper: compute pet age in years
function petAgeYears(birthDate) {
  if (!birthDate) return null;
  return (Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
}

function petAgeGroup(birthDate) {
  const age = petAgeYears(birthDate);
  if (age === null) return "Unknown";
  if (age < 1) return "< 1 year";
  if (age < 3) return "1-3 years";
  if (age < 5) return "3-5 years";
  if (age < 8) return "5-8 years";
  return "8+ years";
}

router.get("/statistics", async (req, res) => {
  try {
    if (!USER_VIEW_ROLES.includes(req.userRole)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Parse filter query params
    const filterPetTypes = req.query.petTypes ? req.query.petTypes.split(",") : [];
    const filterCities = req.query.cities ? req.query.cities.split(",") : [];
    const filterGenders = req.query.genders ? req.query.genders.split(",") : [];
    const filterBreeds = req.query.breeds ? req.query.breeds.split(",") : [];
    const filterVaccineNames = req.query.vaccineNames ? req.query.vaccineNames.split(",") : [];
    const filterAgeGroups = req.query.ageGroups ? req.query.ageGroups.split(",") : [];
    const filterPeriodFrom = req.query.periodFrom ? new Date(req.query.periodFrom) : null;
    const filterPeriodTo = req.query.periodTo ? (() => { const d = new Date(req.query.periodTo); d.setHours(23, 59, 59, 999); return d; })() : null;

    let users = await User.find({}, "-password").lean();
    if (req.query.petsOnly === "true") {
      users = users.filter(u => u.pets && u.pets.length > 0);
    }

    // Filter users by city
    if (filterCities.length > 0) {
      users = users.filter(u => filterCities.includes(u.city || "Unknown"));
    }

    const allVaccineTypes = await Vaccine.find().lean();

    // Flatten all pets with owner info
    let allPets = [];
    for (const u of users) {
      for (const p of u.pets) {
        allPets.push({ ...p, ownerCity: u.city || "Unknown", ownerName: `${u.firstName} ${u.lastName}` });
      }
    }

    // Apply pet-level filters
    if (filterPetTypes.length > 0) {
      allPets = allPets.filter(p => filterPetTypes.includes(p.type));
    }
    if (filterGenders.length > 0) {
      allPets = allPets.filter(p => filterGenders.includes(p.gender));
    }
    if (filterBreeds.length > 0) {
      allPets = allPets.filter(p => filterBreeds.includes(p.breed));
    }
    if (filterAgeGroups.length > 0) {
      allPets = allPets.filter(p => filterAgeGroups.includes(petAgeGroup(p.birthDate)));
    }
    if (filterVaccineNames.length > 0) {
      allPets = allPets.filter(p =>
        p.vaccines && p.vaccines.some(v => filterVaccineNames.includes(v.vaccineName))
      );
    }
    if (filterPeriodFrom || filterPeriodTo) {
      allPets = allPets.filter(p => {
        const inVisit = p.vetVisits && p.vetVisits.some(v => {
          const vd = new Date(v.date);
          if (filterPeriodFrom && vd < filterPeriodFrom) return false;
          if (filterPeriodTo && vd > filterPeriodTo) return false;
          return true;
        });
        const inVacc = p.vaccines && p.vaccines.some(v => {
          const vd = new Date(v.date);
          if (filterPeriodFrom && vd < filterPeriodFrom) return false;
          if (filterPeriodTo && vd > filterPeriodTo) return false;
          return true;
        });
        return inVisit || inVacc;
      });
    }

    // Helper: filter visits/vaccines by period if active
    const filterEventsByPeriod = (events, dateField = "date") => {
      if (!filterPeriodFrom && !filterPeriodTo) return events || [];
      if (!events) return [];
      return events.filter(e => {
        const d = new Date(e[dateField]);
        if (filterPeriodFrom && d < filterPeriodFrom) return false;
        if (filterPeriodTo && d > filterPeriodTo) return false;
        return true;
      });
    };

    // 1. Pets per city
    const petsByCity = {};
    for (const p of allPets) {
      const city = p.ownerCity || "Unknown";
      petsByCity[city] = (petsByCity[city] || 0) + 1;
    }

    // 2. Pets vaccinated per vaccine name (period-aware)
    const petsPerVaccine = {};
    for (const p of allPets) {
      const vaccs = filterEventsByPeriod(p.vaccines);
      if (!vaccs.length) continue;
      const seen = new Set();
      for (const v of vaccs) {
        if (!seen.has(v.vaccineName)) {
          seen.add(v.vaccineName);
          petsPerVaccine[v.vaccineName] = (petsPerVaccine[v.vaccineName] || 0) + 1;
        }
      }
    }

    // 3. Pets by type
    const petsByType = {};
    for (const p of allPets) {
      petsByType[p.type] = (petsByType[p.type] || 0) + 1;
    }

    // 4. Pets by gender
    const petsByGender = {};
    for (const p of allPets) {
      petsByGender[p.gender] = (petsByGender[p.gender] || 0) + 1;
    }

    // 5. Pets by breed (top 15)
    const petsByBreed = {};
    for (const p of allPets) {
      const key = `${p.breed} (${p.type})`;
      petsByBreed[key] = (petsByBreed[key] || 0) + 1;
    }

    // 6. Top visit reasons (period-aware)
    const visitReasons = {};
    for (const p of allPets) {
      const visits = filterEventsByPeriod(p.vetVisits);
      for (const v of visits) {
        visitReasons[v.reason] = (visitReasons[v.reason] || 0) + 1;
      }
    }

    // 7. Overview counters (period-aware for visits/vaccines)
    const totalUsers = users.length;
    const totalPets = allPets.length;
    const totalVisits = allPets.reduce((s, p) => s + filterEventsByPeriod(p.vetVisits).length, 0);
    const totalVaccinations = allPets.reduce((s, p) => s + filterEventsByPeriod(p.vaccines).length, 0);
    const petsWithVaccines = allPets.filter(p => filterEventsByPeriod(p.vaccines).length > 0).length;
    const vaccinationRate = totalPets > 0 ? Math.round((petsWithVaccines / totalPets) * 100) : 0;
    const avgVisitsPerPet = totalPets > 0 ? (totalVisits / totalPets).toFixed(1) : "0";
    const avgVaccinesPerPet = totalPets > 0 ? (totalVaccinations / totalPets).toFixed(1) : "0";

    // 8. Users with most pets (top 10)
    const topOwners = users
      .map(u => {
        const count = allPets.filter(p => p.ownerName === `${u.firstName} ${u.lastName}`).length;
        return { name: `${u.firstName} ${u.lastName}`, count };
      })
      .filter(u => u.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 9. Monthly new pets (last 12 months)
    const monthlyPets = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyPets[key] = 0;
    }
    for (const p of allPets) {
      if (!p.createdAt) continue;
      const d = new Date(p.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key in monthlyPets) monthlyPets[key]++;
    }

    // 10. Vaccination coverage per vaccine type (period-aware)
    const vaccineCoverage = [];
    for (const vt of allVaccineTypes) {
      const eligiblePets = allPets.filter(p => vt.PetType.includes(p.type)).length;
      const vaccinatedPets = allPets.filter(p =>
        filterEventsByPeriod(p.vaccines).some(v => v.vaccineName === vt.Name)
      ).length;
      vaccineCoverage.push({
        name: vt.Name,
        petTypes: vt.PetType,
        eligible: eligiblePets,
        vaccinated: vaccinatedPets,
        rate: eligiblePets > 0 ? Math.round((vaccinatedPets / eligiblePets) * 100) : 0
      });
    }

    // 11. Cities with most visits (period-aware)
    const visitsByCity = {};
    for (const p of allPets) {
      const visits = filterEventsByPeriod(p.vetVisits);
      if (!visits.length) continue;
      const city = p.ownerCity || "Unknown";
      visitsByCity[city] = (visitsByCity[city] || 0) + visits.length;
    }

    // 12. Pet age distribution
    const ageGroupCounts = { "< 1 year": 0, "1-3 years": 0, "3-5 years": 0, "5-8 years": 0, "8+ years": 0, "Unknown": 0 };
    for (const p of allPets) {
      ageGroupCounts[petAgeGroup(p.birthDate)]++;
    }

    res.json({
      overview: { totalUsers, totalPets, totalVisits, totalVaccinations, vaccinationRate, avgVisitsPerPet, avgVaccinesPerPet },
      petsByCity,
      petsPerVaccine,
      petsByType,
      petsByGender,
      petsByBreed,
      visitReasons,
      topOwners,
      monthlyPets,
      vaccineCoverage,
      visitsByCity,
      ageGroups: ageGroupCounts
    });
  } catch (err) {
    console.error("GET /admin/statistics error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── PET TYPES ──────────────────────────────────────────────
// CRUD operations for pet types (same pattern as vaccine types).

// GET /api/admin/petTypes — List all pet types with creator names
router.get("/petTypes", async (req, res) => {
  try {
    const list = await withCreator(PetType.find().sort({ createdAt: -1 }));
    res.json(list);
  } catch (err) {
    console.error("GET /admin/petTypes error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/admin/petTypes — Create a new pet type
router.post("/petTypes", async (req, res) => {
  try {
    const { petType } = req.body;
    if (!petType) return res.status(400).json({ message: "Pet type name is required" });
    const existing = await PetType.findOne({ petType: petType.trim() });
    if (existing) return res.status(400).json({ message: "Pet type already exists" });
    await PetType.create({ petType: petType.trim(), createdBy: req.userId });
    await ActivityLog.create({ userId: req.userId, action: "add", target: "petType", targetName: petType.trim() });
    const list = await withCreator(PetType.find().sort({ createdAt: -1 }));
    res.json(list);
  } catch (err) {
    console.error("POST /admin/petTypes error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/admin/petTypes/:id — Edit a pet type name
router.put("/petTypes/:id", async (req, res) => {
  try {
    const { petType } = req.body;
    if (!petType) return res.status(400).json({ message: "Pet type name is required" });
    const doc = await PetType.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Pet type not found" });
    // Editor: can only edit own items within 24 hours
    if (req.userRole === "editor") {
      if (!doc.createdBy || doc.createdBy.toString() !== req.userId) {
        return res.status(403).json({ message: "You can only edit items you created" });
      }
      if (Date.now() - new Date(doc.createdAt).getTime() > 24 * 60 * 60 * 1000) {
        return res.status(403).json({ message: "Edit window (24 hours) has expired" });
      }
    }
    doc.petType = petType.trim();
    await doc.save();
    await ActivityLog.create({ userId: req.userId, action: "edit", target: "petType", targetName: petType.trim() });
    const list = await withCreator(PetType.find().sort({ createdAt: -1 }));
    res.json(list);
  } catch (err) {
    console.error("PUT /admin/petTypes error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/admin/petTypes/:id/toggle — Toggle pet type enabled/disabled
router.patch("/petTypes/:id/toggle", async (req, res) => {
  try {
    const doc = await PetType.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Pet type not found" });
    if (req.userRole === "editor") {
      if (!doc.createdBy || doc.createdBy.toString() !== req.userId) {
        return res.status(403).json({ message: "You can only modify items you created" });
      }
      if (Date.now() - new Date(doc.createdAt).getTime() > 24 * 60 * 60 * 1000) {
        return res.status(403).json({ message: "Edit window (24 hours) has expired" });
      }
    }
    doc.disabled = !doc.disabled;
    await doc.save();
    await ActivityLog.create({ userId: req.userId, action: doc.disabled ? "disable" : "enable", target: "petType", targetName: doc.petType });
    const list = await withCreator(PetType.find().sort({ createdAt: -1 }));
    res.json(list);
  } catch (err) {
    console.error("PATCH /admin/petTypes/:id/toggle error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/admin/petTypes/:id — Delete a pet type (within 24h only)
router.delete("/petTypes/:id", async (req, res) => {
  try {
    const doc = await PetType.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Pet type not found" });
    if (Date.now() - new Date(doc.createdAt).getTime() > 24 * 60 * 60 * 1000) {
      return res.status(403).json({ message: "Can only delete pet types within 24 hours of creation" });
    }
    if (req.userRole === "editor") {
      if (!doc.createdBy || doc.createdBy.toString() !== req.userId) {
        return res.status(403).json({ message: "You can only delete items you created" });
      }
    }
    const ptName = doc.petType;
    await doc.deleteOne();
    await ActivityLog.create({ userId: req.userId, action: "delete", target: "petType", targetName: ptName });
    const list = await withCreator(PetType.find().sort({ createdAt: -1 }));
    res.json(list);
  } catch (err) {
    console.error("DELETE /admin/petTypes error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── BREEDS ──────────────────────────────────────────────────
// CRUD operations for breeds (same pattern as vaccine types).

// GET /api/admin/breeds — List all breeds with creator names
router.get("/breeds", async (req, res) => {
  try {
    const list = await withCreator(Breed.find().sort({ createdAt: -1 }));
    res.json(list);
  } catch (err) {
    console.error("GET /admin/breeds error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/admin/breeds — Create a new breed
router.post("/breeds", async (req, res) => {
  try {
    const { breed, type } = req.body;
    if (!breed || !type) return res.status(400).json({ message: "Breed name and type are required" });
    const existing = await Breed.findOne({ breed: breed.trim(), type: type.trim() });
    if (existing) return res.status(400).json({ message: "This breed already exists for that type" });
    await Breed.create({ breed: breed.trim(), type: type.trim(), createdBy: req.userId });
    await ActivityLog.create({ userId: req.userId, action: "add", target: "breed", targetName: `${breed.trim()} (${type.trim()})` });
    const list = await withCreator(Breed.find().sort({ createdAt: -1 }));
    res.json(list);
  } catch (err) {
    console.error("POST /admin/breeds error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/admin/breeds/:id — Edit a breed's name/type
router.put("/breeds/:id", async (req, res) => {
  try {
    const { breed, type } = req.body;
    if (!breed || !type) return res.status(400).json({ message: "Breed name and type are required" });
    const doc = await Breed.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Breed not found" });
    // Editor: can only edit own items within 24 hours
    if (req.userRole === "editor") {
      if (!doc.createdBy || doc.createdBy.toString() !== req.userId) {
        return res.status(403).json({ message: "You can only edit items you created" });
      }
      if (Date.now() - new Date(doc.createdAt).getTime() > 24 * 60 * 60 * 1000) {
        return res.status(403).json({ message: "Edit window (24 hours) has expired" });
      }
    }
    doc.breed = breed.trim();
    doc.type = type.trim();
    await doc.save();
    await ActivityLog.create({ userId: req.userId, action: "edit", target: "breed", targetName: `${breed.trim()} (${type.trim()})` });
    const list = await withCreator(Breed.find().sort({ createdAt: -1 }));
    res.json(list);
  } catch (err) {
    console.error("PUT /admin/breeds error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/admin/breeds/:id/toggle — Toggle breed enabled/disabled
router.patch("/breeds/:id/toggle", async (req, res) => {
  try {
    const doc = await Breed.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Breed not found" });
    if (req.userRole === "editor") {
      if (!doc.createdBy || doc.createdBy.toString() !== req.userId) {
        return res.status(403).json({ message: "You can only modify items you created" });
      }
      if (Date.now() - new Date(doc.createdAt).getTime() > 24 * 60 * 60 * 1000) {
        return res.status(403).json({ message: "Edit window (24 hours) has expired" });
      }
    }
    doc.disabled = !doc.disabled;
    await doc.save();
    await ActivityLog.create({ userId: req.userId, action: doc.disabled ? "disable" : "enable", target: "breed", targetName: `${doc.breed} (${doc.type})` });
    const list = await withCreator(Breed.find().sort({ createdAt: -1 }));
    res.json(list);
  } catch (err) {
    console.error("PATCH /admin/breeds/:id/toggle error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/admin/breeds/:id — Delete a breed (within 24h only)
router.delete("/breeds/:id", async (req, res) => {
  try {
    const doc = await Breed.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Breed not found" });
    if (Date.now() - new Date(doc.createdAt).getTime() > 24 * 60 * 60 * 1000) {
      return res.status(403).json({ message: "Can only delete breeds within 24 hours of creation" });
    }
    if (req.userRole === "editor") {
      if (!doc.createdBy || doc.createdBy.toString() !== req.userId) {
        return res.status(403).json({ message: "You can only delete items you created" });
      }
    }
    const breedName = `${doc.breed} (${doc.type})`;
    await doc.deleteOne();
    await ActivityLog.create({ userId: req.userId, action: "delete", target: "breed", targetName: breedName });
    const list = await withCreator(Breed.find().sort({ createdAt: -1 }));
    res.json(list);
  } catch (err) {
    console.error("DELETE /admin/breeds error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── ACTIVITY STATS ─────────────────────────────────────────
// Staff performance tracking and audit trail.
// Aggregates action counts by user, target type, and action type.
// Admin sees all staff; sub-admin sees editors and self only.

// GET /api/admin/activity-stats — Staff activity breakdown with optional period filter
router.get("/activity-stats", async (req, res) => {
  try {
    if (!USER_VIEW_ROLES.includes(req.userRole)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Determine which users this requester can see
    const allStaff = await User.find(
      { role: { $in: MANAGE_ROLES } },
      "firstName lastName role"
    ).lean();

    let visibleIds;
    if (req.userRole === "admin") {
      visibleIds = allStaff.map(u => String(u._id));
    } else {
      // sub-admin sees self + editors
      visibleIds = allStaff
        .filter(u => String(u._id) === req.userId || u.role === "editor")
        .map(u => String(u._id));
    }

    const logQuery = { userId: { $in: visibleIds } };
    const periodFrom = req.query.periodFrom ? new Date(req.query.periodFrom) : null;
    const periodTo = req.query.periodTo ? new Date(req.query.periodTo + "T23:59:59.999Z") : null;
    if (periodFrom || periodTo) {
      logQuery.timestamp = {};
      if (periodFrom) logQuery.timestamp.$gte = periodFrom;
      if (periodTo) logQuery.timestamp.$lte = periodTo;
    }

    const logs = await ActivityLog.find(logQuery)
      .sort({ timestamp: -1 })
      .lean();

    // Build per-user summary
    const userMap = {};
    for (const u of allStaff) {
      if (visibleIds.includes(String(u._id))) {
        userMap[String(u._id)] = {
          _id: String(u._id),
          name: `${u.firstName} ${u.lastName}`,
          role: u.role,
          totals: { add: 0, edit: 0, delete: 0, enable: 0, disable: 0 },
          byTarget: { vaccine: { add: 0, edit: 0, delete: 0, enable: 0, disable: 0 }, petType: { add: 0, edit: 0, delete: 0, enable: 0, disable: 0 }, breed: { add: 0, edit: 0, delete: 0, enable: 0, disable: 0 } },
          recentActions: []
        };
      }
    }

    for (const log of logs) {
      const uid = String(log.userId);
      if (!userMap[uid]) continue;
      userMap[uid].totals[log.action] = (userMap[uid].totals[log.action] || 0) + 1;
      if (userMap[uid].byTarget[log.target]) {
        userMap[uid].byTarget[log.target][log.action] = (userMap[uid].byTarget[log.target][log.action] || 0) + 1;
      }
      if (userMap[uid].recentActions.length < 20) {
        userMap[uid].recentActions.push({
          action: log.action,
          target: log.target,
          targetName: log.targetName,
          timestamp: log.timestamp
        });
      }
    }

    // Aggregate totals across all visible users
    const overallTotals = { add: 0, edit: 0, delete: 0, enable: 0, disable: 0 };
    const byTarget = { vaccine: { add: 0, edit: 0, delete: 0, enable: 0, disable: 0 }, petType: { add: 0, edit: 0, delete: 0, enable: 0, disable: 0 }, breed: { add: 0, edit: 0, delete: 0, enable: 0, disable: 0 } };
    for (const u of Object.values(userMap)) {
      for (const a of Object.keys(overallTotals)) overallTotals[a] += u.totals[a];
      for (const t of Object.keys(byTarget)) {
        for (const a of Object.keys(byTarget[t])) byTarget[t][a] += u.byTarget[t][a];
      }
    }

    res.json({
      users: Object.values(userMap),
      overallTotals,
      byTarget
    });
  } catch (err) {
    console.error("GET /admin/activity-stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
