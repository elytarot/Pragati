// src/app.js — PRAGATI Backend Entry Point
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const rateLimit = require("express-rate-limit");
const { verifyToken } = require("./middleware/auth");
const { auditLog } = require("./middleware/audit");
const { startNotificationCrons } = require("./jobs/notifications");

const app = express();

// ── SECURITY ────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

// Global rate limiter
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: "RATE_LIMIT", message: "Too many requests. Please wait." },
}));

// ── PUBLIC ROUTES (no auth) ─────────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));

// ── PROTECTED ROUTES ────────────────────────────────────────────────
app.use("/api/children",     verifyToken, auditLog, require("./routes/children"));
app.use("/api/iep",          verifyToken, auditLog, require("./routes/iep"));
app.use("/api/assessments",  verifyToken, auditLog, require("./routes/assessments"));
app.use("/api/interventions",verifyToken, auditLog, require("./routes/interventions"));
app.use("/api/devices",      verifyToken, auditLog, require("./routes/devices"));
app.use("/api/reports",      verifyToken,           require("./routes/reports"));
app.use("/api/ai",           verifyToken,           require("./routes/ai"));
app.use("/api/locations",    verifyToken,           require("./routes/locations"));
app.use("/api/admin",        verifyToken, auditLog, require("./routes/admin"));
app.use("/api/dashboard",    verifyToken,           require("./routes/dashboard"));
app.use("/api/notifications",verifyToken,           require("./routes/notifications"));

// ── HEALTH CHECK ────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    portal: "PRAGATI — Bright Beginnings NGO",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    portal: "PRAGATI — Bright Beginnings NGO",
    timestamp: new Date().toISOString(),
  });
});

// ── GLOBAL ERROR HANDLER ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  if (process.env.NODE_ENV === "development") console.error(err.stack);
  res.status(err.status || 500).json({
    code: err.code || "SERVER_ERROR",
    message: err.message || "An unexpected error occurred",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ── 404 HANDLER ─────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ code: "NOT_FOUND", message: `Route ${req.method} ${req.path} not found` });
});

// ── START SERVER ────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log("─".repeat(55));
  console.log(`  PRAGATI Backend v1.0.0`);
  console.log(`  Running on port ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("─".repeat(55));
  // Start cron jobs
  startNotificationCrons();
});

module.exports = app;
