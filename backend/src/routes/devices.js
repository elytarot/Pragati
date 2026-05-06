// src/routes/devices.js
const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const { getScope } = require("../middleware/auth");
const prisma = new PrismaClient();

const DEVICE_CATALOG = {
  "Visually Impaired":        ["Smart Cane","Braille Kit","DAISY Player","Braille Display","Smart Glasses","Talking Calculator","Talking Watch","Screen Reader Software","Smartphone (Accessibility)","Laptop (with NVDA)","Braille Note Taker"],
  "Hearing Impaired":         ["Hearing Aid (Mono)","Hearing Aid (Binaural)","FM System","Cochlear Implant (Referral)","Sign Language App","Visual Alert System","Vibrating Alarm","Amplified Phone"],
  "Physical Disability":      ["Manual Wheelchair","Motorized Wheelchair","Walker/Rollator","Crutches","Adapted Tricycle","Prosthetic Limb","AFO Orthosis","Special Seating","Gait Trainer","Standing Frame"],
  "Autism Spectrum Disorder": ["AAC Communication Board","Speech Generating Device","Sensory Tools","Social Story Apps","Visual Schedule Board","Noise-Cancelling Headphones","Fidget Tools","Weighted Blanket","Timer"],
  "Cerebral Palsy":           ["Powered Wheelchair","Gait Trainer","Standing Frame","AFO Splint","Eye Gaze Device","Adapted Computer Input","Head Pointer","Adapted Spoon/Fork"],
  "Intellectual Disability":  ["AAC Device","Picture Exchange Cards","Communication Board","Adapted Books","Simple Switch Device","Activity Schedules"],
  "Learning Disability":      ["Text-to-Speech Software","Audio Books","Reading Pen","Word Prediction Software","Colored Overlays","Digital Magnifier","Spell Checker"],
  "Speech & Language Disorder":["Speech Generating Device","Voice Amplifier","AAC App","PECS Cards","Communication Board","Electrolarynx"],
  "Multiple Disability":      ["Multi-Modal AAC System","Snoezelen Sensory Tools","Adapted Equipment","Eye Gaze + Switch Combo"],
  "Down Syndrome":            ["Communication Aid","Picture Cards","AAC App","Adapted Books","Simple Switch Device","Sensory Tools"],
};

// GET /api/devices/catalog — disability-wise device list
router.get("/catalog", (req, res) => {
  const { disability } = req.query;
  if (disability) return res.json({ disability, devices: DEVICE_CATALOG[disability] || [] });
  res.json(DEVICE_CATALOG);
});

// GET /api/devices
router.get("/", async (req, res, next) => {
  try {
    const { childId, provider, disability, page = 1, limit = 50 } = req.query;
    const scope = getScope(req.user);
    const where = {
      ...(childId    && { childId }),
      ...(provider   && { provider }),
      ...(disability && { disabilityType: disability }),
      child: { is: { ...scope, deletedAt: null } },
    };
    const [devices, total] = await Promise.all([
      prisma.assistiveDevice.findMany({
        where, orderBy: { dateGiven: "desc" },
        skip: (page - 1) * +limit, take: +limit,
        include: { child: { select: { name: true, bbId: true } } },
      }),
      prisma.assistiveDevice.count({ where }),
    ]);
    res.json({ data: devices, total, page: +page, totalPages: Math.ceil(total / +limit) });
  } catch (err) { next(err); }
});

// POST /api/devices
router.post("/", async (req, res, next) => {
  try {
    const { childId, disabilityType, deviceName, provider, dateGiven } = req.body;
    if (!childId || !disabilityType || !deviceName || !provider || !dateGiven)
      return res.status(400).json({ code: "MISSING_FIELDS", message: "childId, disabilityType, deviceName, provider, dateGiven required" });

    // Auto-set follow-up date to 90 days after distribution
    const followUpDate = new Date(dateGiven);
    followUpDate.setDate(followUpDate.getDate() + 90);

    const device = await prisma.assistiveDevice.create({
      data: { ...req.body, dateGiven: new Date(dateGiven), followUpDate,
              warrantyExpiry: req.body.warrantyExpiry ? new Date(req.body.warrantyExpiry) : null },
      include: { child: { select: { name: true, bbId: true } } },
    });
    res.status(201).json(device);
  } catch (err) { next(err); }
});

// PUT /api/devices/:id
router.put("/:id", async (req, res, next) => {
  try {
    const { id, child, createdAt, ...data } = req.body;
    if (data.dateGiven)      data.dateGiven      = new Date(data.dateGiven);
    if (data.warrantyExpiry) data.warrantyExpiry = new Date(data.warrantyExpiry);
    if (data.followUpDate)   data.followUpDate   = new Date(data.followUpDate);
    const updated = await prisma.assistiveDevice.update({ where: { id: req.params.id }, data: { ...data, updatedAt: new Date() } });
    res.json(updated);
  } catch (err) { next(err); }
});

// GET /api/devices/stats
router.get("/stats", async (req, res, next) => {
  try {
    const scope = getScope(req.user);
    const where = { child: { is: { ...scope, deletedAt: null } } };
    const [total, byProvider, overdueFollowUp] = await Promise.all([
      prisma.assistiveDevice.count({ where }),
      prisma.assistiveDevice.groupBy({ by: ["provider"], where, _count: { provider: true } }),
      prisma.assistiveDevice.count({ where: { ...where, followUpDate: { lt: new Date() } } }),
    ]);
    res.json({ total, byProvider: byProvider.map((p) => ({ provider: p.provider, count: p._count.provider })), overdueFollowUp });
  } catch (err) { next(err); }
});

module.exports = router;
