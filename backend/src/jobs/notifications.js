// src/jobs/notifications.js — Scheduled notification cron jobs
const cron    = require("node-cron");
const { PrismaClient } = require("@prisma/client");
const { sendSMS, SMS_TEMPLATES } = require("../utils/sms");
const prisma  = new PrismaClient();

// ── HELPER: Create in-app notification ─────────────────────────────
const createNotification = async (userId, title, message, type, entityType, entityId) => {
  await prisma.notification.create({
    data: { userId, title, message, type, entityType: entityType || null, entityId: entityId || null },
  });
};

// ── HELPER: Notify a user (in-app + optional SMS) ──────────────────
const notifyUser = async (user, title, message, type, entityType, entityId, sendSMSFlag = false) => {
  await createNotification(user.id, title, message, type, entityType, entityId);
  if (sendSMSFlag && user.phone) {
    await sendSMS(user.phone, message);
  }
};

// ── JOB 1: IEP Review Due (runs daily at 8am) ──────────────────────
// Checks IEPs with quarterly review date within next 7 days
const checkIEPReviews = async () => {
  console.log("[CRON] Checking IEP review dates...");
  try {
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);
    const today = new Date();

    const plans = await prisma.iEPPlan.findMany({
      where: { status: "ACTIVE" },
      include: { child: { include: { worker: true } } },
    });

    // Simple quarterly check: if IEP created and 90 days passed
    for (const plan of plans) {
      const daysSinceCreated = Math.floor((Date.now() - plan.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const reviewDue = daysSinceCreated % 90 >= 83; // within 7 days of 90-day mark

      if (reviewDue && plan.child?.worker) {
        const msg = SMS_TEMPLATES.iepReviewDue(plan.child.name, plan.child.bbId, "7 days");
        await notifyUser(
          plan.child.worker, "IEP Review Due",
          `IEP review for ${plan.child.name} (${plan.child.bbId}) is due within 7 days.`,
          "IEP_REVIEW_DUE", "iep", plan.id, false
        );
      }
    }
    console.log(`[CRON] IEP review check complete`);
  } catch (err) { console.error("[CRON] IEP review error:", err.message); }
};

// ── JOB 2: Baseline Pending (runs daily at 8:30am) ─────────────────
const checkBaselinePending = async () => {
  console.log("[CRON] Checking baseline assessments...");
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);

    const childrenWithoutBaseline = await prisma.child.findMany({
      where: {
        status: "ASSESSMENT_PENDING",
        createdAt: { lt: cutoff },
        assessments: { none: { type: "BASELINE" } },
      },
      include: { worker: true },
    });

    for (const child of childrenWithoutBaseline) {
      if (!child.worker) continue;
      const daysSince = Math.floor((Date.now() - child.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      await notifyUser(
        child.worker, "Baseline Assessment Pending",
        `${child.name} (${child.bbId}) was enrolled ${daysSince} days ago. Baseline still pending.`,
        "BASELINE_PENDING", "child", child.id, false
      );
    }
    console.log(`[CRON] Baseline check: ${childrenWithoutBaseline.length} pending`);
  } catch (err) { console.error("[CRON] Baseline check error:", err.message); }
};

// ── JOB 3: IEP Not Created (runs daily at 9am) ─────────────────────
const checkIEPNotCreated = async () => {
  console.log("[CRON] Checking IEP creation...");
  try {
    const cutoff14 = new Date();
    cutoff14.setDate(cutoff14.getDate() - 14);

    const children = await prisma.child.findMany({
      where: {
        status: "IEP_PENDING",
        updatedAt: { lt: cutoff14 },
        iepPlans: { none: {} },
      },
      include: { worker: true },
    });

    for (const child of children) {
      if (!child.worker) continue;
      await notifyUser(
        child.worker, "IEP Not Created",
        `${child.name} (${child.bbId}) has baseline done 14+ days ago. Please create IEP.`,
        "IEP_NOT_CREATED", "child", child.id, true  // send SMS for escalation
      );
    }
    console.log(`[CRON] IEP creation check: ${children.length} pending`);
  } catch (err) { console.error("[CRON] IEP check error:", err.message); }
};

// ── JOB 4: No Intervention (runs daily at 9:30am) ──────────────────
const checkNoIntervention = async () => {
  console.log("[CRON] Checking intervention frequency...");
  try {
    const cutoff14 = new Date();
    cutoff14.setDate(cutoff14.getDate() - 14);

    const activeChildren = await prisma.child.findMany({
      where: { status: "ACTIVE", deletedAt: null },
      include: {
        worker: true,
        interventions: { orderBy: { date: "desc" }, take: 1 },
      },
    });

    let count = 0;
    for (const child of activeChildren) {
      const lastInt = child.interventions[0];
      if (!lastInt || new Date(lastInt.date) < cutoff14) {
        if (!child.worker) continue;
        const days = lastInt
          ? Math.floor((Date.now() - new Date(lastInt.date).getTime()) / (1000 * 60 * 60 * 24))
          : Math.floor((Date.now() - child.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        await notifyUser(
          child.worker, "No Intervention Logged",
          `No intervention logged for ${child.name} (${child.bbId}) in ${days} days. Please log sessions.`,
          "NO_INTERVENTION", "child", child.id, false
        );
        count++;
      }
    }
    console.log(`[CRON] Intervention check: ${count} children flagged`);
  } catch (err) { console.error("[CRON] Intervention check error:", err.message); }
};

// ── JOB 5: Device Follow-up (runs daily at 10am) ───────────────────
const checkDeviceFollowups = async () => {
  console.log("[CRON] Checking device follow-ups...");
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dueDevices = await prisma.assistiveDevice.findMany({
      where: { followUpDate: { gte: today, lt: tomorrow } },
      include: { child: { include: { worker: true } } },
    });

    for (const device of dueDevices) {
      if (!device.child?.worker) continue;
      await notifyUser(
        device.child.worker, "Device Follow-up Due",
        `Follow-up check due for ${device.deviceName} given to ${device.child.name} (${device.child.bbId}).`,
        "DEVICE_FOLLOWUP", "device", device.id, false
      );
    }
    console.log(`[CRON] Device follow-up: ${dueDevices.length} due today`);
  } catch (err) { console.error("[CRON] Device follow-up error:", err.message); }
};

// ── START ALL CRON JOBS ─────────────────────────────────────────────
const startNotificationCrons = () => {
  if (process.env.NODE_ENV === "test") return;

  // Daily at 8:00 AM IST
  cron.schedule("0 8 * * *", checkIEPReviews,      { timezone: "Asia/Kolkata" });
  cron.schedule("30 8 * * *", checkBaselinePending, { timezone: "Asia/Kolkata" });
  cron.schedule("0 9 * * *",  checkIEPNotCreated,   { timezone: "Asia/Kolkata" });
  cron.schedule("30 9 * * *", checkNoIntervention,  { timezone: "Asia/Kolkata" });
  cron.schedule("0 10 * * *", checkDeviceFollowups, { timezone: "Asia/Kolkata" });

  console.log("✅ Notification cron jobs started (IST timezone)");
};

module.exports = { startNotificationCrons, checkIEPReviews, checkBaselinePending, checkIEPNotCreated, checkNoIntervention, checkDeviceFollowups };
