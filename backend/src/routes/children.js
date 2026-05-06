// src/routes/children.js
const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const { getScope, requireRole } = require("../middleware/auth");
const { uploadPhoto, uploadToR2 } = require("../middleware/upload");

const prisma = new PrismaClient();

// GET /api/children
router.get("/", async (req, res, next) => {
  try {
    const scope = getScope(req.user);
    const { search, districtId, blockId, disability, cls, status, gender, page = 1, limit = 25 } = req.query;

    const where = {
      ...scope, deletedAt: null,
      ...(districtId && { districtId }),
      ...(blockId    && { blockId }),
      ...(cls        && { currentClass: cls }),
      ...(status     && { status }),
      ...(gender     && { gender }),
      ...(search && {
        OR: [
          { name:    { contains: search, mode: "insensitive" } },
          { bbId:    { contains: search, mode: "insensitive" } },
          { village: { contains: search, mode: "insensitive" } },
          { schoolName: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(disability && { disabilities: { some: { type: disability } } }),
    };

    const [children, total] = await Promise.all([
      prisma.child.findMany({
        where,
        skip:    (page - 1) * +limit,
        take:    +limit,
        include: { disabilities: true, district: { select: { name: true } }, block: { select: { name: true } },
                   worker: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.child.count({ where }),
    ]);

    res.json({ data: children, total, page: +page, limit: +limit, totalPages: Math.ceil(total / +limit) });
  } catch (err) { next(err); }
});

// GET /api/children/:id — full profile
router.get("/:id", async (req, res, next) => {
  try {
    const scope = getScope(req.user);
    const child = await prisma.child.findFirst({
      where: { id: req.params.id, ...scope, deletedAt: null },
      include: {
        disabilities: true,
        district:     { select: { name: true } },
        block:        { select: { name: true } },
        worker:       { select: { id: true, name: true, email: true } },
        iepPlans: {
          include: { goals: { orderBy: { createdAt: "asc" } }, services: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        assessments:  { orderBy: { date: "desc" }, take: 20 },
        interventions:{ orderBy: { date: "desc" }, take: 20 },
        devices:      { orderBy: { dateGiven: "desc" } },
        documents:    { orderBy: { createdAt: "desc" } },
      },
    });
    if (!child) return res.status(404).json({ code: "NOT_FOUND", message: "Child not found or access denied" });
    res.json(child);
  } catch (err) { next(err); }
});

// POST /api/children — register new child
router.post("/", async (req, res, next) => {
  try {
    const { name, dob, gender, districtId, blockId, village, schoolName, currentClass, disabilities = [], ...rest } = req.body;

    if (!name || !dob || !gender || !districtId || !blockId || !village || !schoolName || !currentClass)
      return res.status(400).json({ code: "MISSING_FIELDS", message: "Required: name, dob, gender, districtId, blockId, village, schoolName, currentClass" });

    // Verify district/block exist
    const [dist, block] = await Promise.all([
      prisma.location.findUnique({ where: { id: districtId } }),
      prisma.location.findUnique({ where: { id: blockId } }),
    ]);
    if (!dist)  return res.status(400).json({ code: "INVALID_DISTRICT" });
    if (!block) return res.status(400).json({ code: "INVALID_BLOCK" });

    // Generate BB-ID: BB-UDR-BDG-0001
    const distCode  = dist.name.substring(0, 3).toUpperCase();
    const blockCode = block.name.substring(0, 3).toUpperCase();
    const count     = await prisma.child.count({ where: { districtId, blockId } });
    const bbId      = `BB-${distCode}-${blockCode}-${String(count + 1).padStart(4, "0")}`;

    const child = await prisma.child.create({
      data: {
        bbId, name, dob: new Date(dob), gender, districtId, blockId, village, schoolName, currentClass,
        assignedWorkerId: req.user.userId,
        ...(rest.aadharNo     && { aadharNo: rest.aadharNo }),
        ...(rest.certNo       && { certNo: rest.certNo }),
        ...(rest.certAuthority && { certAuthority: rest.certAuthority }),
        ...(rest.category     && { category: rest.category }),
        ...(rest.bplStatus    && { bplStatus: rest.bplStatus }),
        ...(rest.schoolType   && { schoolType: rest.schoolType }),
        ...(rest.udiseCode    && { udiseCode: rest.udiseCode }),
        ...(rest.gramPanchayat && { gramPanchayat: rest.gramPanchayat }),
        ...(rest.habitation   && { habitation: rest.habitation }),
        ...(rest.pincode      && { pincode: rest.pincode }),
        ...(rest.primaryDiagnosis && { primaryDiagnosis: rest.primaryDiagnosis }),
        ...(rest.comorbidity  && { comorbidity: rest.comorbidity }),
        ...(rest.medications  && { medications: rest.medications }),
        ...(rest.customData   && { customData: rest.customData }),
        disabilities: {
          create: disabilities.map((d) => ({
            type: d.type, severity: d.severity || null,
            isPrimary: d.isPrimary || false, diagnosis: d.diagnosis || null,
          })),
        },
      },
      include: { disabilities: true, district: { select: { name: true } }, block: { select: { name: true } } },
    });

    // Auto-set status
    await prisma.child.update({
      where: { id: child.id },
      data:  { status: "ASSESSMENT_PENDING" },
    });

    res.status(201).json({ ...child, status: "ASSESSMENT_PENDING" });
  } catch (err) { next(err); }
});

// PUT /api/children/:id
router.put("/:id", async (req, res, next) => {
  try {
    const scope = getScope(req.user);
    const existing = await prisma.child.findFirst({ where: { id: req.params.id, ...scope, deletedAt: null } });
    if (!existing) return res.status(404).json({ code: "NOT_FOUND" });

    const { disabilities, ...updateData } = req.body;
    delete updateData.bbId; // Never allow changing BB-ID
    delete updateData.id;
    if (updateData.dob) updateData.dob = new Date(updateData.dob);

    await prisma.$transaction(async (tx) => {
      await tx.child.update({
        where: { id: req.params.id },
        data: { ...updateData, updatedAt: new Date() },
      });

      if (disabilities) {
        await tx.disability.deleteMany({ where: { childId: req.params.id } });
        if (disabilities.length > 0) {
          await tx.disability.createMany({
            data: disabilities.map((d) => ({
              childId: req.params.id,
              type: d.type,
              severity: d.severity || null,
              isPrimary: d.isPrimary || false,
              diagnosis: d.diagnosis || null,
            })),
          });
        }
      }
    });

    const updated = await prisma.child.findUnique({
      where: { id: req.params.id },
      include: {
        disabilities: true,
        district: { select: { name: true } },
        block: { select: { name: true } },
        worker: { select: { id: true, name: true, email: true } },
      },
    });

    res.json(updated);
  } catch (err) { next(err); }
});

// POST /api/children/:id/photo
router.post("/:id/photo", uploadPhoto.single("photo"), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ code: "NO_FILE" });
  try {
    const file = await uploadToR2(req.file, `children/${req.params.id}/photos`);
    await prisma.child.update({ where: { id: req.params.id }, data: { photoUrl: file.url } });
    res.json({ url: file.url });
  } catch (err) { next(err); }
});

// DELETE /api/children/:id — soft delete
router.delete("/:id", requireRole("SUPER_ADMIN"), async (req, res, next) => {
  try {
    await prisma.child.update({ where: { id: req.params.id }, data: { deletedAt: new Date(), status: "DROPOUT" } });
    res.json({ success: true, message: "Child record soft-deleted" });
  } catch (err) { next(err); }
});

// GET /api/children/:id/summary — quick stats
router.get("/:id/summary", async (req, res, next) => {
  try {
    const [iepCount, assessCount, interventionCount, deviceCount] = await Promise.all([
      prisma.iEPPlan.count({ where: { childId: req.params.id } }),
      prisma.assessment.count({ where: { childId: req.params.id } }),
      prisma.intervention.count({ where: { childId: req.params.id } }),
      prisma.assistiveDevice.count({ where: { childId: req.params.id } }),
    ]);
    res.json({ iepCount, assessCount, interventionCount, deviceCount });
  } catch (err) { next(err); }
});

module.exports = router;
