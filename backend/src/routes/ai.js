// src/routes/ai.js — Secure AI proxy (Claude / GPT-4 / Gemini)
const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const axios  = require("axios");
const prisma = new PrismaClient();

// ── CALL AI PROVIDER ────────────────────────────────────────────────
const callAI = async (provider, prompt, maxTokens = 1800, customApiKey = null) => {
  switch (provider) {
    case "claude": {
      const apiKey = customApiKey || process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error("Anthropic API key is missing");
      const res = await axios.post(
        "https://api.anthropic.com/v1/messages",
        { model: "claude-3-5-sonnet-20241022", max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] },
        { headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" } }
      );
      return res.data.content[0].text;
    }
    case "openai": {
      const apiKey = customApiKey || process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("OpenAI API key is missing");
      const res = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        { model: "gpt-4o", max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] },
        { headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" } }
      );
      return res.data.choices[0].message.content;
    }
    case "gemini": {
      const apiKey = customApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API key is missing");
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
        { contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: maxTokens } },
        { headers: { "Content-Type": "application/json" } }
      );
      return res.data.candidates[0].content.parts[0].text;
    }
    default: throw new Error(`Unknown AI provider: ${provider}`);
  }
};

// POST /api/ai/goals — generate IEP goals
router.post("/goals", async (req, res, next) => {
  try {
    const { childId, goalArea = "All Areas", language = "English", provider = "gemini", apiKey } = req.body;

    let childContext = "";
    if (childId) {
      const child = await prisma.child.findUnique({
        where: { id: childId },
        include: {
          disabilities: true,
          assessments:  { orderBy: { date: "desc" }, take: 6 },
          iepPlans:     { include: { goals: true }, orderBy: { createdAt: "desc" }, take: 1 },
        },
      });
      if (child) {
        const age = Math.floor((Date.now() - child.dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        const prevGoals = child.iepPlans[0]?.goals.map((g) => `- ${g.goalStatement}`).join("\n") || "None";
        const assessSummary = child.assessments.map((a) => `${a.type} - ${a.domain}: ${a.score}/100 (${a.level || "N/A"})`).join("\n") || "No assessments yet";
        childContext = `
CHILD PROFILE:
• Name: ${child.name} | Age: ${age} yrs | Gender: ${child.gender} | Class: ${child.currentClass}
• School: ${child.schoolName} | Village: ${child.village}
• Disability: ${child.disabilities.map((d) => `${d.type} (${d.severity || "Moderate"})`).join(", ")}

LATEST ASSESSMENTS:
${assessSummary}

PREVIOUS IEP GOALS (do not repeat):
${prevGoals}`;
      }
    } else {
      const { name, age, gender, cls, disability, severity } = req.body;
      childContext = `CHILD PROFILE:\n• Name: ${name || "Child"} | Age: ${age || "N/A"} | Gender: ${gender || "N/A"} | Class: ${cls || "N/A"}\n• Disability: ${disability || "N/A"} (${severity || "Moderate"})`;
    }

    const prompt = `You are a Special Education expert trained in India's RPWD Act 2016, NEP 2020, Samagra Shiksha guidelines, and NCERT curriculum.

${childContext}

GOAL AREA FOCUS: ${goalArea}
CONTEXT: Rural Rajasthan. Limited specialist access. Basic assistive devices available through Bright Beginnings NGO.

Generate 5 SMART IEP goals. For EACH goal provide:

**Domain:** [domain name]
**SMART Goal:** [Specific, Measurable, Achievable, Relevant, Time-bound statement]
**Current Baseline:** [what child can currently do — specific and observable]
**End-of-Year Target:** [clear success criteria]
**Activities (2-3):** [practical activities using locally available materials in rural Rajasthan]
**Progress Measurement:** [how to collect data and track progress]

Cover: Academic/FLN, Communication, Daily Living Skills, Social-Emotional, and one disability-specific domain.
Align with: NEP 2020 FLN Mission benchmarks, RPWD Act 2016 entitlements, Samagra Shiksha IE norms, NCERT curriculum.
${language === "Hindi" || language === "Hindi (Bilingual)" ? "Also include Hindi translation of each goal statement." : ""}`;

    const aiText = await callAI(provider, prompt, 1800, apiKey);

    // Audit log
    await prisma.auditLog.create({
      data: { userId: req.user.userId, action: "AI_GENERATE", entityType: "child", entityId: childId || null,
              newValue: { provider, goalArea, language } },
    });

    res.json({ text: aiText, provider });
  } catch (err) {
    console.error("[ERROR] POST /api/ai/goals:", err.response?.data || err.message);
    if (err.response?.status === 401) return res.status(401).json({ code: "AI_AUTH_ERROR", message: "AI API key invalid or missing" });
    if (err.response?.status === 429) return res.status(429).json({ code: "AI_RATE_LIMIT", message: "AI rate limit reached. Try again in a moment." });
    next(err);
  }
});

// POST /api/ai/intervention-suggestions
router.post("/intervention-suggestions", async (req, res, next) => {
  try {
    const { childId, interventionType, iepGoal, provider = "gemini", apiKey } = req.body;
    let childInfo = "CWSN Child, rural Rajasthan";
    if (childId) {
      const child = await prisma.child.findUnique({ where: { id: childId }, include: { disabilities: true } });
      if (child) {
        const age = Math.floor((Date.now() - child.dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        childInfo = `${child.name}, Age ${age}, ${child.currentClass}, Disability: ${child.disabilities.map((d) => d.type).join(", ")}`;
      }
    }
    const prompt = `Suggest 4 practical intervention activities for:
Child: ${childInfo}
Session type: ${interventionType}
IEP Goal: ${iepGoal}
Context: Rural Rajasthan. Field worker may not be a specialist. Use locally available, low-cost materials.

For each activity provide:
1. Activity name
2. Materials needed (locally available)
3. Step-by-step instructions (3-4 steps)
4. Expected outcome / how to know it worked`;

    const text = await callAI(provider, prompt, 800, apiKey);
    res.json({ text, provider });
  } catch (err) { next(err); }
});

// POST /api/ai/progress-summary — generate quarterly parent letter
router.post("/progress-summary", async (req, res, next) => {
  try {
    const { childId, language = "Hindi", provider = "gemini", apiKey } = req.body;
    const child = await prisma.child.findUnique({
      where: { id: childId },
      include: { iepPlans: { include: { goals: true }, take: 1, orderBy: { createdAt: "desc" } }, disabilities: true },
    });
    if (!child) return res.status(404).json({ code: "NOT_FOUND" });

    const goals = child.iepPlans[0]?.goals || [];
    const goalsText = goals.map((g) => `${g.domain}: ${g.goalStatement} — Progress: ${g.achievementPct}% (${g.status})`).join("\n");

    const prompt = `Write a warm, positive, parent-friendly quarterly progress letter for:
Child: ${child.name} | Class: ${child.currentClass} | Disability: ${child.disabilities.map((d) => d.type).join(", ")}

IEP Goals Progress:
${goalsText || "No goals recorded yet"}

Write in ${language}. Tone: encouraging, strength-based, simple language suitable for rural parents.
Include: what child achieved, what needs more practice, how parent can support at home. Keep under 250 words.`;

    const text = await callAI(provider, prompt, 600, apiKey);
    res.json({ text, provider });
  } catch (err) { next(err); }
});

module.exports = router;
