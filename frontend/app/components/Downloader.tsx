"use client";

import { useState } from "react";
import Image from "next/image";
import { detectPlatform, isValidUrl, formatDuration } from "../lib/platform";
import { getPreview, requestDownload, getQrCode, PreviewResult } from "../lib/api";
import PlatformBadge from "./PlatformBadge";

type Stage = "idle" | "loading-preview" | "ready" | "downloading" | "error";

export default function Downloader() {
  const [url, setUrl] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [format, setFormat] = useState<"mp4" | "mp3">("mp4");
  const [quality, setQuality] = useState<number>(720);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);

  const platform = url ? detectPlatform(url) : null;

  async function handlePreview() {
    setError(null);
    setPreview(null);
    setQr(null);

    if (!isValidUrl(url)) {
      setError("That doesn't look like a valid URL.");
      setStage("error");
      return;
    }
    if (!platform) {
      setError("Unsupported link. Paste a YouTube, Instagram, or Facebook video URL.");
      setStage("error");
      return;
    }

    setStage("loading-preview");
    try {
      const result = await getPreview(url);
      setPreview(result);
      setQuality(result.availableQualities[result.availableQualities.length - 1] || 720);
      setStage("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStage("error");
    }
  }

  async function handleDownload() {
    setStage("downloading");
    setProgress(8);
    setError(null);

    // Simulated smooth progress while the server processes — real byte-level
    // progress would need a streaming/SSE endpoint; this keeps the UI honest
    // by capping at 90% until the file actually arrives.
    const tick = setInterval(() => {
      setProgress((p) => (p < 90 ? p + Math.random() * 12 : p));
    }, 400);

    try {
      const blob = await requestDownload(url, format, quality);
      clearInterval(tick);
      setProgress(100);

      const a = document.createElement("a");
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = `${(preview?.title || "reelfetch-download").slice(0, 60)}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);

      setStage("ready");
      setTimeout(() => setProgress(0), 1500);
    } catch (e) {
      clearInterval(tick);
      setError(e instanceof Error ? e.message : "Download failed.");
      setStage("error");
      setProgress(0);
    }
  }

  async function handleShare() {
    try {
      const code = await getQrCode(url);
      setQr(code);
    } catch {
      setError("Couldn't generate a QR code right now.");
    }
  }

  return (
    <div className="relative mx-auto max-w-2xl">
      <div className="rounded-2xl border border-reel-line bg-reel-panel/80 p-6 shadow-2xl backdrop-blur sm:p-8">
        <div className="sprocket-rail mb-6 rounded-full" />

        <label htmlFor="video-url" className="mb-2 block text-sm text-reel-mist">
          Video link
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="video-url"
            type="url"
            inputMode="url"
            placeholder="https://youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePreview()}
            className="flex-1 rounded-lg border border-reel-line bg-reel-charcoal px-4 py-3 text-reel-paper placeholder:text-reel-mist/60 focus:border-reel-amber"
          />
          <button
            onClick={handlePreview}
            disabled={stage === "loading-preview"}
            className="rounded-lg bg-reel-amber px-6 py-3 font-medium text-reel-black transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            {stage === "loading-preview" ? "Fetching…" : "Fetch details"}
          </button>
        </div>

        {platform && (
          <div className="mt-3">
            <PlatformBadge platform={platform} />
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        {preview && (
          <div className="mt-6 border-t border-reel-line pt-6">
            <div className="flex gap-4">
              {preview.thumbnail && (
                <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-lg border border-reel-line">
                  <Image src={preview.thumbnail} alt={preview.title} fill className="object-cover" unoptimized />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium text-reel-paper">{preview.title}</p>
                {preview.uploader && (
                  <p className="mt-0.5 truncate text-sm text-reel-mist">{preview.uploader}</p>
                )}
                <p className="timecode mt-2">{formatDuration(preview.durationSeconds)}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-sm text-reel-mist">Format</p>
                <div className="flex gap-2">
                  {(["mp4", "mp3"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        format === f
                          ? "border-reel-amber bg-reel-amber/10 text-reel-amber"
                          : "border-reel-line text-reel-mist hover:border-reel-mist"
                      }`}
                    >
                      {f === "mp4" ? "MP4 Video" : "MP3 Audio"}
                    </button>
                  ))}
                </div>
              </div>

              {format === "mp4" && (
                <div>
                  <p className="mb-2 text-sm text-reel-mist">Quality</p>
                  <div className="flex gap-2">
                    {[360, 720, 1080].map((q) => {
                      const available = preview.availableQualities.includes(q);
                      return (
                        <button
                          key={q}
                          disabled={!available}
                          onClick={() => setQuality(q)}
                          className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                            quality === q
                              ? "border-reel-teal bg-reel-teal/10 text-reel-teal"
                              : "border-reel-line text-reel-mist hover:border-reel-mist"
                          } ${!available ? "cursor-not-allowed opacity-30" : ""}`}
                        >
                          {q}p
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {stage === "downloading" && (
              <div className="mt-5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-reel-charcoal">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-reel-amber to-reel-teal transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="timecode mt-2">{Math.min(100, Math.round(progress))}%</p>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleDownload}
                disabled={stage === "downloading"}
                className="rounded-lg bg-reel-amber px-6 py-3 font-medium text-reel-black transition-transform hover:scale-[1.02] disabled:opacity-60"
              >
                {stage === "downloading" ? "Downloading…" : `Download ${format.toUpperCase()}`}
              </button>
              <button
                onClick={handleShare}
                className="rounded-lg border border-reel-line px-6 py-3 text-sm text-reel-mist transition-colors hover:border-reel-teal hover:text-reel-teal"
              >
                Share via QR
              </button>
            </div>

            {qr && (
              <div className="mt-5 inline-block rounded-lg border border-reel-line bg-white p-3">
                <Image src={qr} alt="QR code for this link" width={140} height={140} unoptimized />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
