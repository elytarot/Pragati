// src/routes/locations.js
const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const { requireRole } = require("../middleware/auth");
const prisma = new PrismaClient();

// GET /api/locations — full tree
router.get("/", async (req, res, next) => {
  try {
    const districts = await prisma.location.findMany({
      where: { type: "DISTRICT", isActive: true },
      include: { children: { where: { type: "BLOCK", isActive: true }, orderBy: { name: "asc" } } },
      orderBy: { name: "asc" },
    });
    res.json(districts);
  } catch (err) { next(err); }
});

// GET /api/locations/blocks?districtId=xxx
router.get("/blocks", async (req, res, next) => {
  try {
    const { districtId } = req.query;
    const blocks = await prisma.location.findMany({
      where: { type: "BLOCK", isActive: true, ...(districtId && { parentId: districtId }) },
      orderBy: { name: "asc" },
    });
    res.json(blocks);
  } catch (err) { next(err); }
});

// POST /api/locations — add district or block (Admin only)
router.post("/", requireRole("SUPER_ADMIN", "DISTRICT_COORDINATOR"), async (req, res, next) => {
  try {
    const { name, type, parentId, state } = req.body;
    if (!name || !type) return res.status(400).json({ code: "MISSING_FIELDS" });
    const loc = await prisma.location.create({ data: { name, type, parentId: parentId || null, state: state || "Rajasthan" } });
    res.status(201).json(loc);
  } catch (err) { next(err); }
});

// PUT /api/locations/:id
router.put("/:id", requireRole("SUPER_ADMIN"), async (req, res, next) => {
  try {
    const updated = await prisma.location.update({ where: { id: req.params.id }, data: req.body });
    res.json(updated);
  } catch (err) { next(err); }
});

module.exports = router;


// ── NOTIFICATIONS ──────────────────────────────────────────────────
// src/routes/notifications.js
