"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { getHistory, deleteHistoryEntry, HistoryEntry } from "../lib/api";
import PlatformBadge from "./PlatformBadge";

export default function HistorySection() {
  const [signedIn, setSignedIn] = useState(false);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setSignedIn(!!user);
      if (user) loadHistory();
      else setEntries([]);
    });
  }, []);

  async function loadHistory() {
    setLoading(true);
    try {
      setEntries(await getHistory());
    } catch {
      // silently ignore — history is non-critical to the core flow
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    try {
      await deleteHistoryEntry(id);
    } catch {
      loadHistory(); // revert on failure
    }
  }

  return (
    <section id="history" className="mx-auto max-w-6xl px-6 py-20">
      <p className="timecode mb-2">reel 03 / your history</p>
      <h2 className="mb-8 font-display text-4xl tracking-wide text-reel-paper">Past pulls.</h2>

      {!signedIn && (
        <div className="rounded-xl border border-dashed border-reel-line p-10 text-center text-reel-mist">
          Sign in to keep a running log of everything you've downloaded.
        </div>
      )}

      {signedIn && loading && <p className="text-reel-mist">Loading your history…</p>}

      {signedIn && !loading && entries.length === 0 && (
        <div className="rounded-xl border border-dashed border-reel-line p-10 text-center text-reel-mist">
          Nothing here yet — your downloads will show up after your first pull.
        </div>
      )}

      {signedIn && entries.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-reel-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-reel-panel text-reel-mist">
              <tr>
                <th className="px-4 py-3 font-normal">Platform</th>
                <th className="px-4 py-3 font-normal">Link</th>
                <th className="px-4 py-3 font-normal">Format</th>
                <th className="px-4 py-3 font-normal">When</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-t border-reel-line/60">
                  <td className="px-4 py-3">
                    <PlatformBadge platform={e.platform} />
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-reel-mist">{e.url}</td>
                  <td className="px-4 py-3 uppercase text-reel-paper">
                    {e.format}
                    {e.quality ? ` · ${e.quality}p` : ""}
                  </td>
                  <td className="timecode px-4 py-3">
                    {new Date(e.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="text-reel-mist transition-colors hover:text-red-400"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
