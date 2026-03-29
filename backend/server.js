/**
 * PetHealth — Express Backend Server
 * ===================================
 * Main entry point for the backend API.
 *
 * This server provides RESTful endpoints for:
 * - User authentication (signup, login)
 * - Pet management (CRUD for pets, vet visits, vaccines)
 * - Admin management (vaccine types, pet types, breeds, users, statistics)
 * - AI-powered health summaries (via OpenAI)
 *
 * External services used:
 * - MongoDB (database)
 * - Cloudinary (pet photo uploads — configured in pets router)
 * - OpenAI (AI health summaries — configured in ai router)
 *
 * Environment variables required (via .env):
 * - MONGODB_URI, JWT_SECRET, CORS_ORIGIN
 * - CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 * - OPENAI_API_KEY
 */

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// ─── Route Imports ──────────────────────────────────────────
const signupRoutes = require("./routers/signup");     // POST /api/signup — user registration
const loginRoutes = require("./routers/login");       // POST /api/login — JWT authentication
const petsRoutes   = require("./routers/pets");       // /api/pets — pet CRUD, visits, vaccines
const petTypesRoutes = require("./routers/petTypes"); // GET /api/petTypes — public pet types list
const breedsRoutes = require("./routers/breeds");     // GET /api/breeds — public breeds list
const vaccinesRouter = require("./routers/vaccines"); // GET /api/vaccines — public vaccines list
const adminRouter = require("./routers/admin");       // /api/admin — management dashboard APIs
const meRouter = require("./routers/me");             // /api/me — user profile management
const aiRouter = require("./routers/ai");             // POST /api/ai/pet-summary — AI health reports

const app = express();

// ─── Global Middleware ──────────────────────────────────────
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));  // Allow cross-origin requests from frontend
app.use(express.json());                                      // Parse JSON request bodies

// ─── Database Connection ────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/pethealth")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ─── API Route Mounting ─────────────────────────────────────
// Public routes (no authentication required)
app.use("/api/signup", signupRoutes);
app.use("/api/login", loginRoutes);
app.use("/api/petTypes", petTypesRoutes);
app.use("/api/breeds", breedsRoutes);
app.use("/api/vaccines", vaccinesRouter);

// Protected routes (require JWT authentication)
app.use("/api/pets", petsRoutes);
app.use("/api/me", meRouter);
app.use("/api/ai", aiRouter);

// Admin routes (require authentication + editor/sub-admin/admin role)
app.use("/api/admin", adminRouter);

// ─── Start Server ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));