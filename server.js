const express = require("express");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const newsletterRoutes = require("./routes/newsletterRoutes");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Connect to MongoDB
(async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Failed:", err.message);
    process.exit(1); // Exit process with failure
  }
})();

// Middleware
app.use(cors({ origin: "*" })); // Allow all origins for testing
app.use(express.json());

// Root route to prevent "Cannot GET /" error
app.get("/", (req, res) => {
  res.send("Welcome to the Newsletter API!");
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/newsletters", newsletterRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
