// src/routes/admin.js
const router   = require("express").Router();
const bcrypt   = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { requireRole } = require("../middleware/auth");
const prisma   = new PrismaClient();

// ── USERS ──────────────────────────────────────────────────────────
router.get("/users", requireRole("SUPER_ADMIN","DISTRICT_COORDINATOR","BLOCK_COORDINATOR"), async (req, res, next) => {
  try {
    const { role, districtId } = req.query;
    // District coordinators can only see their district's users
    const scopedDistrictId = req.user.role === "DISTRICT_COORDINATOR" ? req.user.districtId : districtId;
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(role && { role }),
        ...(scopedDistrictId && { districtId: scopedDistrictId }),
      },
      select: { id: true, name: true, email: true, role: true, status: true, lastLogin: true, phone: true,
                district: { select: { name: true } }, block: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  } catch (err) { next(err); }
});

router.post("/users", requireRole("SUPER_ADMIN","DISTRICT_COORDINATOR"), async (req, res, next) => {
  try {
    const { name, email, password, role, districtId, blockId, phone } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ code: "MISSING_FIELDS", message: "name, email, password, role required" });

    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) return res.status(409).json({ code: "EMAIL_EXISTS", message: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email: email.toLowerCase(), passwordHash, role, phone: phone || null,
              districtId: districtId || null, blockId: blockId || null },
      select: { id: true, name: true, email: true, role: true, status: true },
    });
    res.status(201).json(user);
  } catch (err) { next(err); }
});

router.put("/users/:id", requireRole("SUPER_ADMIN","DISTRICT_COORDINATOR"), async (req, res, next) => {
  try {
    const { password, passwordHash, ...data } = req.body;
    const updateData = { ...data };
    if (password) updateData.passwordHash = await bcrypt.hash(password, 12);
    const updated = await prisma.user.update({
      where: { id: req.params.id }, data: updateData,
      select: { id: true, name: true, email: true, role: true, status: true },
    });
    res.json(updated);
  } catch (err) { next(err); }
});

router.delete("/users/:id", requireRole("SUPER_ADMIN"), async (req, res, next) => {
  try {
    if (req.params.id === req.user.userId)
      return res.status(400).json({ code: "SELF_DELETE", message: "Cannot delete your own account" });
    await prisma.user.update({ where: { id: req.params.id }, data: { deletedAt: new Date(), status: "INACTIVE" } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── FORM FIELDS ────────────────────────────────────────────────────
router.get("/form-fields/:module", async (req, res, next) => {
  try {
    const fields = await prisma.formField.findMany({
      where: { module: req.params.module, isActive: true },
      orderBy: [{ section: "asc" }, { displayOrder: "asc" }],
    });
    res.json(fields);
  } catch (err) { next(err); }
});

router.post("/form-fields", requireRole("SUPER_ADMIN"), async (req, res, next) => {
  try {
    const field = await prisma.formField.create({ data: req.body });
    res.status(201).json(field);
  } catch (err) { next(err); }
});

router.put("/form-fields/:id", requireRole("SUPER_ADMIN"), async (req, res, next) => {
  try {
    const { id, createdAt, ...data } = req.body;
    const updated = await prisma.formField.update({ where: { id: req.params.id }, data: { ...data, updatedAt: new Date() } });
    res.json(updated);
  } catch (err) { next(err); }
});

router.delete("/form-fields/:id", requireRole("SUPER_ADMIN"), async (req, res, next) => {
  try {
    await prisma.formField.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── AUDIT LOG ──────────────────────────────────────────────────────
router.get("/audit-log", requireRole("SUPER_ADMIN","DISTRICT_COORDINATOR"), async (req, res, next) => {
  try {
    const { entityType, action, userId, from, to, page = 1, limit = 50 } = req.query;
    const where = {
      ...(entityType && { entityType }),
      ...(action     && { action }),
      ...(userId     && { userId }),
      ...(from || to ? { timestamp: { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) } } : {}),
    };
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where, orderBy: { timestamp: "desc" },
        skip: (page - 1) * +limit, take: +limit,
        include: { user: { select: { name: true, role: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);
    res.json({ data: logs, total, page: +page, totalPages: Math.ceil(total / +limit) });
  } catch (err) { next(err); }
});

// ── SYSTEM HEALTH ──────────────────────────────────────────────────
router.get("/health", requireRole("SUPER_ADMIN"), async (req, res, next) => {
  try {
    const [children, users, ieps, interventions] = await Promise.all([
      prisma.child.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null, status: "ACTIVE" } }),
      prisma.iEPPlan.count({ where: { status: "ACTIVE" } }),
      prisma.intervention.count(),
    ]);
    res.json({ database: "healthy", counts: { children, users, ieps, interventions }, timestamp: new Date().toISOString() });
  } catch (err) { next(err); }
});

module.exports = router;
