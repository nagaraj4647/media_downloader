const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { validateUrlMiddleware } = require("../middleware/validateUrl");
const { optionalAuth } = require("../middleware/auth");
const { downloadLimiter } = require("../middleware/rateLimiter");
const { fetchMetadata, downloadMedia, deleteTempFile } = require("../services/downloader");
const { db } = require("../config/firebase");
const logger = require("../services/logger");

/**
 * POST /api/preview
 * Body: { url }
 * Returns metadata (thumbnail, title, duration, quality options) without downloading.
 */
router.post("/preview", downloadLimiter, validateUrlMiddleware, async (req, res) => {
  try {
    const meta = await fetchMetadata(req.cleanUrl);
    res.json({ platform: req.platform, ...meta });
  } catch (err) {
    logger.error("Preview failed", { error: err.message, url: req.cleanUrl });
    res.status(422).json({
      error: "Couldn't fetch details for this link. Double-check it's public and try again.",
    });
  }
});

/**
 * POST /api/download
 * Body: { url, format: "mp4"|"mp3", quality?: 360|720|1080 }
 * Streams the media file back to the client, then deletes the temp copy.
 * Works for guests; if a valid auth token is present, saves to history.
 */
router.post(
  "/download",
  downloadLimiter,
  optionalAuth,
  validateUrlMiddleware,
  body("format").isIn(["mp4", "mp3"]).withMessage("format must be mp4 or mp3"),
  body("quality").optional().isIn([360, 720, 1080]).withMessage("Invalid quality"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { format, quality } = req.body;
    let filePath;

    try {
      filePath = await downloadMedia(req.cleanUrl, { format, quality });

      res.download(filePath, undefined, async (err) => {
        deleteTempFile(filePath); // never store permanently — cleanup runs regardless of outcome
        if (err) logger.error("File stream failed", { error: err.message });
      });

      // Save history for signed-in users (fire-and-forget, doesn't block the response)
      if (req.uid) {
        db.collection("downloads")
          .add({
            userId: req.uid,
            url: req.cleanUrl,
            platform: req.platform,
            format,
            quality: quality || null,
            createdAt: new Date().toISOString(),
          })
          .catch((e) => logger.error("Failed to save history", { error: e.message }));
      }
    } catch (err) {
      if (filePath) deleteTempFile(filePath);
      logger.error("Download failed", { error: err.message, url: req.cleanUrl });
      res.status(422).json({
        error: "This link couldn't be processed. It may be private, region-locked, or removed.",
      });
    }
  }
);

module.exports = router;
