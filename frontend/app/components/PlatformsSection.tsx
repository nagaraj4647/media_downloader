const PLATFORMS = [
  {
    name: "YouTube",
    color: "#FF4E4E",
    note: "Videos, shorts & audio-only extraction",
  },
  {
    name: "Instagram",
    color: "#E1306C",
    note: "Reels and public video posts",
  },
  {
    name: "Facebook",
    color: "#4267B2",
    note: "Public videos and watch links",
  },
];

export default function PlatformsSection() {
  return (
    <section id="platforms" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <p className="timecode mb-2">reel 02 / supported sources</p>
          <h2 className="font-display text-4xl tracking-wide text-reel-paper">
            Three platforms, one strip.
          </h2>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        {PLATFORMS.map((p) => (
          <div
            key={p.name}
            className="group rounded-xl border border-reel-line bg-reel-panel/60 p-6 transition-colors hover:border-reel-line"
            style={{ borderColor: undefined }}
          >
            <div
              className="mb-4 h-1 w-10 rounded-full transition-all group-hover:w-16"
              style={{ backgroundColor: p.color }}
            />
            <h3 className="font-display text-2xl tracking-wide text-reel-paper">{p.name}</h3>
            <p className="mt-2 text-sm text-reel-mist">{p.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
