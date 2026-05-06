// src/routes/reports.js
const router  = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const { getScope } = require("../middleware/auth");
const { generatePDF }   = require("../utils/pdf");
const { generateExcel } = require("../utils/excel");
const { uploadToR2 }    = require("../middleware/upload");
const prisma = new PrismaClient();

// ── AGGREGATE QUERY ─────────────────────────────────────────────────
const getReportData = async (filters, scope) => {
  const { districtId, from, to } = filters;
  const childWhere = {
    ...scope, deletedAt: null,
    ...(districtId && { districtId }),
  };
  const dateFilter = from || to ? {
    ...(from && { gte: new Date(from) }),
    ...(to   && { lte: new Date(to)   }),
  } : undefined;

  const [children, ieps, assessments, interventions, devices] = await Promise.all([
    prisma.child.findMany({
      where: childWhere,
      include: { disabilities: true, district: { select: { name: true } }, block: { select: { name: true } } },
    }),
    prisma.iEPPlan.findMany({ where: { status: "ACTIVE", child: { is: childWhere } }, include: { goals: true } }),
    prisma.assessment.findMany({ where: { child: { is: childWhere }, ...(dateFilter && { date: dateFilter }) } }),
    prisma.intervention.findMany({ where: { child: { is: childWhere }, ...(dateFilter && { date: dateFilter }) }, include: { child: { select: { name: true, bbId: true, districtId: true } } } }),
    prisma.assistiveDevice.findMany({ where: { child: { is: childWhere } } }),
  ]);

  // Gender breakdown
  const genderBreakdown = { MALE: 0, FEMALE: 0, TRANSGENDER: 0 };
  children.forEach((c) => { genderBreakdown[c.gender] = (genderBreakdown[c.gender] || 0) + 1; });

  // Disability breakdown
  const disabilityBreakdown = {};
  children.forEach((c) => c.disabilities.forEach((d) => { disabilityBreakdown[d.type] = (disabilityBreakdown[d.type] || 0) + 1; }));

  // Class breakdown
  const classBreakdown = {};
  children.forEach((c) => { classBreakdown[c.currentClass] = (classBreakdown[c.currentClass] || 0) + 1; });

  // Age breakdown
  const ageBreakdown = { "3-6": 0, "6-11": 0, "11-15": 0, "15-18": 0, "18-21": 0 };
  children.forEach((c) => {
    const age = Math.floor((Date.now() - c.dob.getTime()) / (365.25 * 24 * 3600 * 1000));
    if (age < 6)        ageBreakdown["3-6"]++;
    else if (age < 11)  ageBreakdown["6-11"]++;
    else if (age < 15)  ageBreakdown["11-15"]++;
    else if (age < 18)  ageBreakdown["15-18"]++;
    else                ageBreakdown["18-21"]++;
  });

  // Intervention by type
  const intByType = {};
  interventions.forEach((i) => { intByType[i.type] = (intByType[i.type] || 0) + 1; });

  const iepChildIds = new Set(ieps.map((i) => i.childId));
  const devChildIds = new Set(devices.map((d) => d.childId));
  const assessed    = new Set(assessments.map((a) => a.childId));

  return {
    summary: {
      totalChildren:    children.length,
      iepActive:        ieps.length,
      iepCoveragePct:   children.length ? Math.round((ieps.length / children.length) * 100) : 0,
      devicesTotal:     devices.length,
      devCoveragePct:   children.length ? Math.round((devChildIds.size / children.length) * 100) : 0,
      assessedCount:    assessed.size,
      interventionsTotal: interventions.length,
    },
    genderBreakdown, disabilityBreakdown, classBreakdown, ageBreakdown, intByType,
    children, ieps, assessments, interventions, devices,
  };
};

// POST /api/reports/generate — generate PDF or Excel
router.post("/generate", async (req, res, next) => {
  try {
    const { type = "overview", period, districtId, dimension = "gender", format = "pdf", from, to } = req.body;
    const scope = getScope(req.user);

    // Create job record
    const job = await prisma.reportJob.create({
      data: {
        requestedBy: req.user.userId, reportType: type,
        period: period || "custom", districtId: districtId || null,
        dimension, status: "PROCESSING",
        filters: { from, to, districtId },
      },
    });

    // Build data
    const data = await getReportData({ districtId, from, to }, scope);
    const reportMeta = {
      title:     `PRAGATI Report — ${type.toUpperCase()}`,
      period:    period || (from && to ? `${from} to ${to}` : "All time"),
      district:  districtId ? data.children[0]?.district?.name : "All Districts",
      dimension, generatedBy: req.user.userId, generatedAt: new Date().toISOString(),
    };

    let fileBuffer, mimeType, extension;
    if (format === "excel") {
      fileBuffer = await generateExcel(data, reportMeta);
      mimeType   = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      extension  = "xlsx";
    } else {
      fileBuffer = await generatePDF(data, reportMeta);
      mimeType   = "application/pdf";
      extension  = "pdf";
    }

    // Upload to R2
    const filename = `reports/pragati-report-${Date.now()}.${extension}`;
    const uploaded = await uploadToR2(
      { buffer: fileBuffer, originalname: `report.${extension}`, mimetype: mimeType, size: fileBuffer.length },
      "reports"
    );

    // Update job
    await prisma.reportJob.update({
      where: { id: job.id },
      data:  { status: "READY", fileUrl: uploaded.url, fileType: format, completedAt: new Date() },
    });

    res.json({ 
      jobId: job.id, status: "READY", downloadUrl: uploaded.url, format,
      rawData: {
        summary: data.summary,
        gender: data.genderBreakdown,
        age: data.ageBreakdown,
        class: data.classBreakdown,
        disability: data.disabilityBreakdown,
        interventions: data.intByType
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/:jobId — check status
router.get("/:jobId", async (req, res, next) => {
  try {
    const job = await prisma.reportJob.findUnique({ where: { id: req.params.jobId } });
    if (!job) return res.status(404).json({ code: "NOT_FOUND" });
    res.json(job);
  } catch (err) { next(err); }
});

// GET /api/reports — list past reports
router.get("/", async (req, res, next) => {
  try {
    const reports = await prisma.reportJob.findMany({
      where: { requestedBy: req.user.userId },
      orderBy: { createdAt: "desc" }, take: 20,
    });
    res.json(reports);
  } catch (err) { next(err); }
});

module.exports = router;
