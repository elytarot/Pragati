// src/routes/assessments.js
const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const { getScope } = require("../middleware/auth");
const prisma = new PrismaClient();

router.get("/", async (req, res, next) => {
  try {
    const { childId, type, domain, page = 1, limit = 50 } = req.query;
    const scope = getScope(req.user);
    const assessments = await prisma.assessment.findMany({
      where: {
        ...(childId && { childId }),
        ...(type   && { type }),
        ...(domain && { domain }),
        child: { is: { ...scope, deletedAt: null } },
      },
      include: { child: { select: { name: true, bbId: true } }, assessor: { select: { name: true } } },
      orderBy: { date: "desc" },
      skip: (page - 1) * +limit, take: +limit,
    });
    res.json(assessments);
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const { childId, type, domain, score, level, notes, date, assessmentTool, language, environment } = req.body;
    if (!childId || !type || !domain || score === undefined || !date)
      return res.status(400).json({ code: "MISSING_FIELDS", message: "childId, type, domain, score, date required" });

    const a = await prisma.assessment.create({
      data: { childId, type, domain, score: +score, level, notes, date: new Date(date),
              assessmentTool, language, environment, assessorId: req.user.userId },
      include: { child: { select: { name: true, bbId: true } }, assessor: { select: { name: true } } },
    });
    // Update child status if baseline done and no IEP
    if (type === "BASELINE") {
      const iep = await prisma.iEPPlan.findFirst({ where: { childId } });
      if (!iep) await prisma.child.update({ where: { id: childId }, data: { status: "IEP_PENDING" } });
    }
    res.status(201).json(a);
  } catch (err) { next(err); }
});

router.get("/gap/:childId", async (req, res, next) => {
  try {
    const assessments = await prisma.assessment.findMany({
      where: { childId: req.params.childId },
      orderBy: { date: "asc" },
    });
    const domains = [...new Set(assessments.map((a) => a.domain))];
    const gap = domains.map((domain) => {
      const baselines = assessments.filter((a) => a.domain === domain && a.type === "BASELINE");
      const endlines  = assessments.filter((a) => a.domain === domain && a.type === "ENDLINE");
      const baseline  = baselines[0]?.score ?? null;
      const endline   = endlines[endlines.length - 1]?.score ?? null;
      const gain      = baseline !== null && endline !== null ? endline - baseline : null;
      return { domain, baseline, endline, gain, improvementPct: gain !== null && baseline > 0 ? Math.round((gain / baseline) * 100) : null };
    });
    res.json(gap);
  } catch (err) { next(err); }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { score, level, notes, date, assessmentTool, language, environment } = req.body;
    const a = await prisma.assessment.update({
      where: { id: req.params.id },
      data: { score: score !== undefined ? +score : undefined, level, notes, date: date ? new Date(date) : undefined, assessmentTool, language, environment },
      include: { child: { select: { name: true, bbId: true } }, assessor: { select: { name: true } } },
    });
    res.json(a);
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.assessment.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
