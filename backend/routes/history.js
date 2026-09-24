const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { db } = require("../config/firebase");
const logger = require("../services/logger");

/**
 * GET /api/history
 * Returns the signed-in user's own download history, newest first.
 */
router.get("/history", requireAuth, async (req, res) => {
  try {
    const snapshot = await db
      .collection("downloads")
      .where("userId", "==", req.uid)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const history = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ history });
  } catch (err) {
    logger.error("Failed to fetch history", { error: err.message, uid: req.uid });
    res.status(500).json({ error: "Couldn't load your history right now." });
  }
});

/**
 * DELETE /api/history/:id
 * Deletes a single history entry belonging to the signed-in user.
 */
router.delete("/history/:id", requireAuth, async (req, res) => {
  try {
    const ref = db.collection("downloads").doc(req.params.id);
    const doc = await ref.get();

    if (!doc.exists || doc.data().userId !== req.uid) {
      return res.status(404).json({ error: "History entry not found." });
    }

    await ref.delete();
    res.json({ success: true });
  } catch (err) {
    logger.error("Failed to delete history entry", { error: err.message });
    res.status(500).json({ error: "Couldn't delete that entry." });
  }
});

module.exports = router;
