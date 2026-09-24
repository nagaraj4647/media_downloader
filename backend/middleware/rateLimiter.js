const rateLimit = require("express-rate-limit");

// General API limiter — protects all routes from abuse
const generalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: Number(process.env.RATE_LIMIT_MAX) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down and try again shortly." },
});

// Stricter limiter specifically for the expensive download/extract endpoint
const downloadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.uid || req.ip, // per-user if authenticated, else per-IP
  message: { error: "Download limit reached. Please wait a few minutes before trying again." },
});

module.exports = { generalLimiter, downloadLimiter };
