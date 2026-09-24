const express = require("express");
const router = express.Router();
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { db, auth } = require("../config/firebase");
const logger = require("../services/logger");

/**
 * GET /api/admin/stats
 * Returns aggregate analytics: total users, total downloads,
 * downloads per platform, and downloads over the last 7 days.
 */
router.get("/admin/stats", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [downloadsSnap, usersResult] = await Promise.all([
      db.collection("downloads").get(),
      auth.listUsers(1000),
    ]);

    const platformCounts = {};
    const last7Days = {};
    const today = new Date();

    downloadsSnap.forEach((doc) => {
      const data = doc.data();
      platformCounts[data.platform] = (platformCounts[data.platform] || 0) + 1;

      const day = (data.createdAt || "").slice(0, 10);
      if (day) last7Days[day] = (last7Days[day] || 0) + 1;
    });

    res.json({
      totalUsers: usersResult.users.length,
      totalDownloads: downloadsSnap.size,
      platformBreakdown: platformCounts,
      dailyDownloads: last7Days,
      generatedAt: today.toISOString(),
    });
  } catch (err) {
    logger.error("Admin stats failed", { error: err.message });
    res.status(500).json({ error: "Couldn't load analytics right now." });
  }
});

module.exports = router;
