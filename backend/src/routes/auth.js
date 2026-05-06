// src/routes/auth.js
const router    = require("express").Router();
const bcrypt    = require("bcryptjs");
const jwt       = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const rateLimit = require("express-rate-limit");
const { verifyToken } = require("../middleware/auth");

const prisma = new PrismaClient();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: { code: "TOO_MANY_ATTEMPTS", message: "Too many failed login attempts. Try again in 15 minutes." },
});

// POST /api/auth/login
router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ code: "MISSING_FIELDS", message: "Email and password are required" });

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { district: { select: { id: true, name: true } }, block: { select: { id: true, name: true } } },
    });

    if (!user || user.deletedAt)
      return res.status(401).json({ code: "INVALID_CREDENTIALS", message: "Invalid email or password" });

    if (user.status !== "ACTIVE")
      return res.status(403).json({ code: "ACCOUNT_INACTIVE", message: "Your account is inactive. Contact admin." });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid)
      return res.status(401).json({ code: "INVALID_CREDENTIALS", message: "Invalid email or password" });

    const payload = {
      userId:     user.id,
      role:       user.role,
      districtId: user.districtId,
      blockId:    user.blockId,
      email:      user.email,
    };

    const accessToken  = jwt.sign(payload, process.env.JWT_SECRET,         { expiresIn: process.env.JWT_EXPIRES_IN  || "8h"  });
    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d" });

    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

    await prisma.auditLog.create({
      data: { userId: user.id, action: "LOGIN", entityType: "user", entityId: user.id, ipAddress: req.ip },
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id:       user.id,
        name:     user.name,
        email:    user.email,
        role:     user.role,
        district: user.district?.name || "All",
        block:    user.block?.name    || "All",
        districtId: user.districtId,
        blockId:    user.blockId,
      },
    });
  } catch (err) { next(err); }
});

// POST /api/auth/refresh
router.post("/refresh", async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(400).json({ code: "MISSING_TOKEN", message: "Refresh token required" });
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { district: true, block: true },
    });
    if (!user || user.status !== "ACTIVE")
      return res.status(401).json({ code: "INVALID_TOKEN" });

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role, districtId: user.districtId, blockId: user.blockId, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );
    res.json({ accessToken });
  } catch {
    res.status(401).json({ code: "INVALID_TOKEN", message: "Invalid or expired refresh token" });
  }
});

// POST /api/auth/logout
router.post("/logout", verifyToken, async (req, res, next) => {
  try {
    await prisma.auditLog.create({
      data: { userId: req.user.userId, action: "LOGOUT", entityType: "user", entityId: req.user.userId, ipAddress: req.ip },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get("/me", verifyToken, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, email: true, role: true, status: true, lastLogin: true,
                district: { select: { id: true, name: true } }, block: { select: { id: true, name: true } } },
    });
    if (!user) return res.status(404).json({ code: "NOT_FOUND" });
    res.json(user);
  } catch (err) { next(err); }
});

// POST /api/auth/change-password
router.post("/change-password", verifyToken, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ code: "MISSING_FIELDS", message: "Both passwords required" });
    if (newPassword.length < 8)
      return res.status(400).json({ code: "WEAK_PASSWORD", message: "Password must be at least 8 characters" });

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid)
      return res.status(401).json({ code: "WRONG_PASSWORD", message: "Current password is incorrect" });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.userId }, data: { passwordHash } });
    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) { next(err); }
});

module.exports = router;
