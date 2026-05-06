// src/routes/interventions.js
const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const { getScope } = require("../middleware/auth");
const prisma = new PrismaClient();

router.get("/", async (req, res, next) => {
  try {
    const { childId, type, from, to, page = 1, limit = 50 } = req.query;
    const scope = getScope(req.user);
    const where = {
      ...(childId && { childId }),
      ...(type    && { type }),
      ...(from || to ? { date: { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) } } : {}),
      child: { is: { ...scope, deletedAt: null } },
    };
    const [interventions, total] = await Promise.all([
      prisma.intervention.findMany({
        where, orderBy: { date: "desc" },
        skip: (page - 1) * +limit, take: +limit,
        include: { child: { select: { name: true, bbId: true } }, staff: { select: { name: true } } },
      }),
      prisma.intervention.count({ where }),
    ]);
    res.json({ data: interventions, total, page: +page, totalPages: Math.ceil(total / +limit) });
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const { childId, type, date, durationMin, topic } = req.body;
    if (!childId || !type || !date || !durationMin || !topic)
      return res.status(400).json({ code: "MISSING_FIELDS", message: "childId, type, date, durationMin, topic required" });

    const intervention = await prisma.intervention.create({
      data: { ...req.body, date: new Date(date), durationMin: +durationMin, staffId: req.user.userId },
      include: { child: { select: { name: true, bbId: true } }, staff: { select: { name: true } } },
    });
    res.status(201).json(intervention);
  } catch (err) { next(err); }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { id, createdAt, child, staff, ...data } = req.body;
    if (data.date) data.date = new Date(data.date);
    if (data.durationMin) data.durationMin = +data.durationMin;
    const updated = await prisma.intervention.update({
      where: { id: req.params.id }, data: { ...data, updatedAt: new Date() },
    });
    res.json(updated);
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.intervention.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// GET /api/interventions/summary — monthly counts by type
router.get("/summary", async (req, res, next) => {
  try {
    const { districtId, month, year } = req.query;
    const scope = getScope(req.user);
    const now = new Date();
    const y = +(year  || now.getFullYear());
    const m = +(month || now.getMonth() + 1);
    const from = new Date(y, m - 1, 1);
    const to   = new Date(y, m, 0, 23, 59, 59);

    const interventions = await prisma.intervention.findMany({
      where: { date: { gte: from, lte: to }, child: { is: { ...scope, ...(districtId && { districtId }), deletedAt: null } } },
      select: { type: true, durationMin: true },
    });

    const summary = {};
    for (const i of interventions) {
      if (!summary[i.type]) summary[i.type] = { count: 0, totalMinutes: 0 };
      summary[i.type].count++;
      summary[i.type].totalMinutes += i.durationMin;
    }
    res.json({ month: m, year: y, total: interventions.length, byType: summary });
  } catch (err) { next(err); }
});

module.exports = router;
