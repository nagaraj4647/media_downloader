import Header from "./components/Header";
import Downloader from "./components/Downloader";
import PlatformsSection from "./components/PlatformsSection";
import HistorySection from "./components/HistorySection";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />

      <section className="relative overflow-hidden px-6 pb-16 pt-20 sm:pt-28">
        {/* ambient scan line — subtle projector-beam flicker, respects reduced-motion */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-hidden opacity-40">
          <div className="h-full w-full animate-scan bg-gradient-to-b from-reel-amber/10 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <p className="timecode mb-4">reel 01 / 03 — 00:00:00</p>
          <h1 className="font-display text-5xl leading-[0.95] tracking-wide text-reel-paper sm:text-7xl">
            Paste. Preview.
            <br />
            <span className="text-reel-amber">Download.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-reel-mist">
            Drop in a YouTube, Instagram, or Facebook link. See the thumbnail, title, and
            duration before you commit — then pull it as MP4 or MP3, in the quality you need.
          </p>
        </div>

        <div className="relative mt-12">
          <Downloader />
        </div>
      </section>

      <PlatformsSection />
      <HistorySection />
      <Footer />
    </main>
  );
}
