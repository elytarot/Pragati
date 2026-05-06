// src/routes/dashboard.js
const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const { getScope } = require("../middleware/auth");
const prisma = new PrismaClient();

router.get("/", async (req, res, next) => {
  try {
    const scope = getScope(req.user);
    const childWhere = { ...scope, deletedAt: null };
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalChildren, activeIEPs, devicesTotal, assessmentsTotal, schoolsRaw, monthlyInterventions,
           districtBreakdown, disabilityBreakdown] = await Promise.all([
      prisma.child.count({ where: childWhere }),
      prisma.iEPPlan.count({ where: { status: "ACTIVE", child: { is: childWhere } } }),
      prisma.assistiveDevice.count({ where: { child: { is: childWhere } } }),
      prisma.assessment.count({ where: { child: { is: childWhere } } }),
      prisma.child.groupBy({ by: ["schoolName"], where: childWhere, _count: { schoolName: true } }),
      prisma.intervention.count({ where: { date: { gte: monthStart }, child: { is: childWhere } } }),
      prisma.child.groupBy({ by: ["districtId"], where: childWhere, _count: { id: true } }),
      prisma.disability.groupBy({ by: ["type"], where: { child: { is: childWhere } }, _count: { type: true } }),
    ]);

    // 6-month trend
    const trend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const [enr, iep, asmnt, int_] = await Promise.all([
        prisma.child.count({ where: { ...childWhere, createdAt: { lte: mEnd } } }),
        prisma.iEPPlan.count({ where: { status: "ACTIVE", child: { is: childWhere }, createdAt: { lte: mEnd } } }),
        prisma.assessment.count({ where: { child: { is: childWhere }, date: { gte: mStart, lte: mEnd } } }),
        prisma.intervention.count({ where: { child: { is: childWhere }, date: { gte: mStart, lte: mEnd } } }),
      ]);
      trend.push({ month: d.toLocaleString("en", { month: "short" }), enrolled: enr, ieps: iep, assessed: asmnt, interventions: int_ });
    }

    res.json({
      kpis: { totalChildren, activeIEPs, devicesTotal, assessmentsTotal,
              schoolsCovered: schoolsRaw.length, monthlyInterventions,
              iepCoveragePct: totalChildren > 0 ? Math.round((activeIEPs / totalChildren) * 100) : 0 },
      trend,
      districtBreakdown: districtBreakdown.map((d) => ({ districtId: d.districtId, count: d._count.id })),
      disabilityBreakdown: disabilityBreakdown.map((d) => ({ type: d.type, count: d._count.type })),
    });
  } catch (err) { next(err); }
});

module.exports = router;
