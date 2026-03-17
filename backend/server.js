require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const signupRoutes = require("./routers/signup");
const loginRoutes = require("./routers/login");
const petsRoutes   = require("./routers/pets");
const petTypesRoutes = require("./routers/petTypes");
const breedsRoutes = require("./routers/breeds");
const vaccinesRouter = require("./routers/vaccines");
const adminRouter = require("./routers/admin");
const meRouter = require("./routers/me");
const aiRouter = require("./routers/ai");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect("mongodb://localhost:27017/pethealth", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/signup", signupRoutes);
app.use("/api/login", loginRoutes);
app.use("/api/pets", petsRoutes);
app.use("/api/petTypes", petTypesRoutes);
app.use("/api/breeds", breedsRoutes);
app.use("/api/vaccines", vaccinesRouter);
app.use("/api/admin", adminRouter);
app.use("/api/me", meRouter);
app.use("/api/ai", aiRouter);

// Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));