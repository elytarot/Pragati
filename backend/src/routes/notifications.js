// src/routes/notifications.js
const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// GET /api/notifications — user's notifications
router.get("/", async (req, res, next) => {
  try {
    const { unreadOnly, page = 1, limit = 30 } = req.query;
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user.userId, ...(unreadOnly === "true" && { isRead: false }) },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * +limit, take: +limit,
      }),
      prisma.notification.count({ where: { userId: req.user.userId, isRead: false } }),
    ]);
    res.json({ data: notifications, unreadCount });
  } catch (err) { next(err); }
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", async (req, res, next) => {
  try {
    await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// PATCH /api/notifications/mark-all-read
router.patch("/mark-all-read", async (req, res, next) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user.userId, isRead: false }, data: { isRead: true } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
