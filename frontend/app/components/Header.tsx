"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  return (
    <header className="sticky top-0 z-30 border-b border-reel-line/60 bg-reel-black/80 backdrop-blur">
      <div className="sprocket-rail" />
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 animate-flicker rounded-full bg-reel-amber shadow-glow" />
          <span className="font-display text-2xl tracking-wide text-reel-paper">
            REEL<span className="text-reel-amber">FETCH</span>
          </span>
        </div>

        <nav className="hidden items-center gap-8 text-sm text-reel-mist sm:flex">
          <a href="#platforms" className="hover:text-reel-paper transition-colors">
            Platforms
          </a>
          <a href="#history" className="hover:text-reel-paper transition-colors">
            History
          </a>
        </nav>

        {user ? (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-reel-mist sm:inline">{user.email}</span>
            <button
              onClick={() => signOut(auth)}
              className="rounded-md border border-reel-line px-3 py-1.5 text-sm text-reel-paper transition-colors hover:border-reel-amber hover:text-reel-amber"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={() => signInWithPopup(auth, googleProvider)}
            className="rounded-md bg-reel-amber px-4 py-1.5 text-sm font-medium text-reel-black transition-transform hover:scale-[1.03]"
          >
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}
