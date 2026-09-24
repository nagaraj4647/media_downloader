require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const fs = require("fs");
const path = require("path");

const { generalLimiter } = require("./middleware/rateLimiter");
const downloadRoutes = require("./routes/download");
const historyRoutes = require("./routes/history");
const adminRoutes = require("./routes/admin");
const qrRoutes = require("./routes/qr");
const logger = require("./services/logger");
const { TMP_DIR } = require("./services/downloader");

const app = express();
const PORT = process.env.PORT || 5000;

// --- Security & core middleware ---
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "DELETE"],
  })
);
app.use(express.json({ limit: "10kb" })); // small limit — we only ever accept a URL + options
app.use(generalLimiter);

// --- Routes ---
app.use("/api", downloadRoutes);
app.use("/api", historyRoutes);
app.use("/api", adminRoutes);
app.use("/api", qrRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// --- 404 + error handling ---
app.use((req, res) => res.status(404).json({ error: "Not found." }));

app.use((err, req, res, next) => {
  logger.error("Unhandled error", { error: err.message, stack: err.stack });
  res.status(500).json({ error: "Something went wrong on our end. Please try again." });
});

// --- Temp file cleanup sweep ---
// Belt-and-suspenders on top of the per-request cleanup in routes/download.js:
// periodically purges anything left behind (e.g. from a crashed request)
// so downloaded media is never retained.
const TTL = Number(process.env.TEMP_FILE_TTL_MS) || 10 * 60 * 1000;
setInterval(() => {
  if (!fs.existsSync(TMP_DIR)) return;
  const now = Date.now();
  for (const file of fs.readdirSync(TMP_DIR)) {
    const filePath = path.join(TMP_DIR, file);
    const stats = fs.statSync(filePath);
    if (now - stats.mtimeMs > TTL) fs.unlink(filePath, () => {});
  }
}, 5 * 60 * 1000);

app.listen(PORT, () => {
  logger.info(`Media Downloader API running on port ${PORT}`);
});
