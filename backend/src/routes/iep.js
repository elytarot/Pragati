// src/routes/iep.js
const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const { getScope } = require("../middleware/auth");

const prisma = new PrismaClient();

// GET /api/iep?childId=xxx
router.get("/", async (req, res, next) => {
  try {
    const { childId } = req.query;
    const scope = getScope(req.user);
    const plans = await prisma.iEPPlan.findMany({
      where: { ...(childId && { childId }), child: { is: { ...scope, deletedAt: null } } },
      include: { goals: { orderBy: { createdAt: "asc" } }, services: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(plans);
  } catch (err) { next(err); }
});

// POST /api/iep
router.post("/", async (req, res, next) => {
  try {
    const { childId, academicYear, ...rest } = req.body;
    if (!childId || !academicYear)
      return res.status(400).json({ code: "MISSING_FIELDS", message: "childId and academicYear required" });

    const existing = await prisma.iEPPlan.findFirst({
      where: { childId, academicYear, status: { in: ["DRAFT", "ACTIVE"] } },
    });
    if (existing)
      return res.status(409).json({ code: "IEP_EXISTS", message: `Active IEP for ${academicYear} already exists` });

    const iep = await prisma.iEPPlan.create({
      data: { childId, academicYear, coordinatorId: req.user.userId, status: "ACTIVE", ...rest },
      include: { goals: true, services: true },
    });

    // Update child status
    await prisma.child.update({ where: { id: childId }, data: { status: "ACTIVE" } });

    res.status(201).json(iep);
  } catch (err) { next(err); }
});

// PUT /api/iep/:id
router.put("/:id", async (req, res, next) => {
  try {
    const { goals, services, ...data } = req.body;
    delete data.id; delete data.childId; delete data.createdAt;
    const updated = await prisma.iEPPlan.update({
      where: { id: req.params.id },
      data:  { ...data, updatedAt: new Date() },
      include: { goals: true, services: true },
    });
    res.json(updated);
  } catch (err) { next(err); }
});

// GET /api/iep/:id/goals
router.get("/:id/goals", async (req, res, next) => {
  try {
    const goals = await prisma.iEPGoal.findMany({
      where: { iepId: req.params.id }, orderBy: { createdAt: "asc" },
    });
    res.json(goals);
  } catch (err) { next(err); }
});

// POST /api/iep/:id/goals
router.post("/:id/goals", async (req, res, next) => {
  try {
    const { domain, goalStatement, baselineDesc, targetDesc, priority, measureMethod, aiGenerated, aiProvider, aiDraft } = req.body;
    if (!domain || !goalStatement)
      return res.status(400).json({ code: "MISSING_FIELDS", message: "domain and goalStatement required" });

    const goal = await prisma.iEPGoal.create({
      data: {
        iepId: req.params.id, domain, goalStatement,
        baselineDesc: baselineDesc || null, targetDesc: targetDesc || null,
        priority: priority || "Medium", measureMethod: measureMethod || null,
        aiGenerated: aiGenerated || false, aiProvider: aiProvider || null, aiDraft: aiDraft || null,
        status: "NOT_STARTED", achievementPct: 0,
      },
    });
    res.status(201).json(goal);
  } catch (err) { next(err); }
});

// PUT /api/iep/goals/:goalId
router.put("/goals/:goalId", async (req, res, next) => {
  try {
    const { id, iepId, createdAt, ...data } = req.body;
    const updated = await prisma.iEPGoal.update({
      where: { id: req.params.goalId }, data: { ...data, updatedAt: new Date() },
    });
    res.json(updated);
  } catch (err) { next(err); }
});

// PATCH /api/iep/goals/:goalId/progress
router.patch("/goals/:goalId/progress", async (req, res, next) => {
  try {
    const { pct, note, status } = req.body;
    if (pct === undefined) return res.status(400).json({ code: "MISSING_PCT" });

    const existing = await prisma.iEPGoal.findUnique({ where: { id: req.params.goalId } });
    if (!existing) return res.status(404).json({ code: "NOT_FOUND" });

    const notes = [...(existing.progressNotes || []), {
      date: new Date().toISOString(), pct, note: note || "", by: req.user.userId,
    }];

    let newStatus = status || existing.status;
    if (+pct >= 100) newStatus = "ACHIEVED";
    else if (+pct > 0 && existing.status === "NOT_STARTED") newStatus = "IN_PROGRESS";

    const updated = await prisma.iEPGoal.update({
      where: { id: req.params.goalId },
      data:  { achievementPct: +pct, status: newStatus, progressNotes: notes, updatedAt: new Date() },
    });
    res.json(updated);
  } catch (err) { next(err); }
});

// DELETE /api/iep/goals/:goalId
router.delete("/goals/:goalId", async (req, res, next) => {
  try {
    await prisma.iEPGoal.delete({ where: { id: req.params.goalId } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST /api/iep/:id/services
router.post("/:id/services", async (req, res, next) => {
  try {
    const service = await prisma.iEPService.create({
      data: { iepId: req.params.id, ...req.body },
    });
    res.status(201).json(service);
  } catch (err) { next(err); }
});

// DELETE /api/iep/services/:serviceId
router.delete("/services/:serviceId", async (req, res, next) => {
  try {
    await prisma.iEPService.delete({ where: { id: req.params.serviceId } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
