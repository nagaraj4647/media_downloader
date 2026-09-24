/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        reel: {
          black: "#0A0C10",   // near-black, cold blue undertone — the "theatre" backdrop
          charcoal: "#14171F",
          panel: "#1B1F2A",
          line: "#2A2F3D",
          amber: "#F2A65A",   // projector-lamp glow — primary accent
          amberDim: "#B97B3A",
          teal: "#4FD1C5",    // secondary accent, cool contrast to amber
          mist: "#8B93A7",    // muted text
          paper: "#EDEFF4",   // near-white text
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "sprocket-strip":
          "repeating-linear-gradient(90deg, transparent 0 18px, rgba(242,166,90,0.14) 18px 20px)",
        "film-grain":
          "radial-gradient(circle at 20% 20%, rgba(242,166,90,0.06), transparent 40%), radial-gradient(circle at 80% 60%, rgba(79,209,197,0.05), transparent 40%)",
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(242,166,90,0.35)",
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.85 },
        },
        reel: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      animation: {
        flicker: "flicker 3.5s ease-in-out infinite",
        reel: "reel 3s linear infinite",
        scan: "scan 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
