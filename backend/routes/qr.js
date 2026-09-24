const express = require("express");
const router = express.Router();
const QRCode = require("qrcode");
const { generalLimiter } = require("../middleware/rateLimiter");

/**
 * POST /api/qr
 * Body: { text }
 * Returns a base64 PNG QR code for the given text/URL (e.g. a share link),
 * so users can scan it with a phone to grab the file directly.
 */
router.post("/qr", generalLimiter, async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== "string" || text.length > 2000) {
    return res.status(400).json({ error: "Provide text or a URL to encode." });
  }

  try {
    const dataUrl = await QRCode.toDataURL(text, { margin: 1, width: 300 });
    res.json({ qr: dataUrl });
  } catch {
    res.status(500).json({ error: "Couldn't generate a QR code for that." });
  }
});

module.exports = router;
