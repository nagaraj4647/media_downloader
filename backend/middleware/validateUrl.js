const { URL } = require("url");

// Allow-listed hostnames per platform — anything outside this list is rejected.
// This is a security boundary: it prevents the downloader from being pointed
// at arbitrary/internal URLs (SSRF protection) as well as unsupported sites.
const PLATFORM_HOSTS = {
  youtube: ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"],
  instagram: ["instagram.com", "www.instagram.com"],
  facebook: ["facebook.com", "www.facebook.com", "fb.watch", "m.facebook.com"],
};

function detectPlatform(hostname) {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  for (const [platform, hosts] of Object.entries(PLATFORM_HOSTS)) {
    if (hosts.some((h) => h.replace(/^www\./, "") === host)) return platform;
  }
  return null;
}

// Blocks obvious SSRF targets (localhost, private IP ranges, link-local, etc.)
function isPrivateOrLocalHost(hostname) {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h === "0.0.0.0" || h === "[::1]") return true;
  const privatePatterns = [
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2\d|3[0-1])\./,
    /^192\.168\./,
    /^169\.254\./,
  ];
  return privatePatterns.some((re) => re.test(h));
}

function validateUrlMiddleware(req, res, next) {
  const { url } = req.body;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "A video URL is required." });
  }

  let parsed;
  try {
    parsed = new URL(url.trim());
  } catch {
    return res.status(400).json({ error: "That doesn't look like a valid URL." });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return res.status(400).json({ error: "Only http/https URLs are supported." });
  }

  if (isPrivateOrLocalHost(parsed.hostname)) {
    return res.status(400).json({ error: "This URL is not allowed." });
  }

  const platform = detectPlatform(parsed.hostname);
  if (!platform) {
    return res.status(400).json({
      error: "Unsupported platform. We currently support YouTube, Instagram, and Facebook.",
    });
  }

  req.platform = platform;
  req.cleanUrl = parsed.toString();
  next();
}

module.exports = { validateUrlMiddleware, detectPlatform, isPrivateOrLocalHost };
