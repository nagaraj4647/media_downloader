import type { Platform } from "../lib/api";

const CONFIG: Record<Platform, { label: string; color: string }> = {
  youtube: { label: "YouTube", color: "#FF4E4E" },
  instagram: { label: "Instagram", color: "#E1306C" },
  facebook: { label: "Facebook", color: "#4267B2" },
};

export default function PlatformBadge({ platform }: { platform: Platform }) {
  const cfg = CONFIG[platform];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
      style={{ borderColor: `${cfg.color}55`, color: cfg.color, backgroundColor: `${cfg.color}14` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
      {cfg.label}
    </span>
  );
}
