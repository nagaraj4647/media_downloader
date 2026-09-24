const YTDlpWrap = require("yt-dlp-wrap").default;
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

// yt-dlp binary path — in production, download the binary during build
// (see backend README section in the deployment instructions) and point
// this at it. Locally, `YTDlpWrap.downloadFromGithub()` can fetch it once.
const BINARY_PATH = process.env.YTDLP_PATH || path.join(__dirname, "..", "bin", "yt-dlp");
const ytDlpWrap = new YTDlpWrap(BINARY_PATH);

const TMP_DIR = path.join(__dirname, "..", "tmp");
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

/**
 * Fetches metadata only (no download) — used to populate the preview card:
 * thumbnail, title, duration, and available quality options.
 */
async function fetchMetadata(url) {
  const raw = await ytDlpWrap.execPromise([url, "--dump-single-json", "--no-warnings"]);
  const info = JSON.parse(raw);

  // Collect distinct progressive/mergeable video heights as "quality options"
  const heights = new Set();
  (info.formats || []).forEach((f) => {
    if (f.height && f.vcodec !== "none") heights.add(f.height);
  });
  const availableQualities = [360, 720, 1080].filter((q) =>
    [...heights].some((h) => h >= q)
  );

  return {
    title: info.title || "Untitled",
    thumbnail: info.thumbnail || (info.thumbnails?.slice(-1)[0]?.url ?? null),
    durationSeconds: info.duration || null,
    uploader: info.uploader || info.channel || null,
    availableQualities: availableQualities.length ? availableQualities : [360],
  };
}

/**
 * Downloads the media to a short-lived temp file and returns its path.
 * Files are NOT stored permanently — the route handler streams the file
 * to the client and then deletes it (see routes/download.js).
 */
async function downloadMedia(url, { format, quality }) {
  const id = uuidv4();
  const outTemplate = path.join(TMP_DIR, `${id}.%(ext)s`);

  const args = [url, "-o", outTemplate, "--no-warnings", "--no-playlist"];

  if (format === "mp3") {
    args.push("-x", "--audio-format", "mp3", "--audio-quality", "0");
  } else {
    // format === "mp4"
    const height = quality || 720;
    args.push("-f", `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`);
    args.push("--merge-output-format", "mp4");
  }

  await ytDlpWrap.execPromise(args);

  const files = fs.readdirSync(TMP_DIR).filter((f) => f.startsWith(id));
  if (!files.length) throw new Error("Download produced no output file.");

  return path.join(TMP_DIR, files[0]);
}

function deleteTempFile(filePath) {
  fs.unlink(filePath, () => {}); // best-effort cleanup, ignore errors
}

module.exports = { fetchMetadata, downloadMedia, deleteTempFile, TMP_DIR };
