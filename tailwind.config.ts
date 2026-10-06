import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}"],
  // MUI's CssBaseline is the app's single reset — Tailwind is retained
  // only for layout utilities (flex/grid/gap/spacing) and the custom
  // motion keyframes below, so its own Preflight reset is turned off to
  // avoid two resets fighting over the same properties.
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        canvas: "#08080a",
        surface: {
          // A faint cool/violet tint instead of true neutral gray — reads as
          // "designed" rather than default-dark-mode gray, while staying
          // subtle enough not to fight the accent color for attention.
          DEFAULT: "#0e0d11",
          raised: "#16151b",
          overlay: "#1d1b24",
          border: "#23212b",
        },
        ink: {
          DEFAULT: "#f6f6f9",
          muted: "#bfbcc9",
          faint: "#9491a1",
        },
        accent: {
          DEFAULT: "#7c5cff",
          soft: "#a18aff",
          dim: "#5d3fd5",
          bright: "#9d7bff",
        },
        // Secondary accent — used sparingly (gradient pairings, a handful of
        // highlight moments) so the palette reads as considered, not busy.
        accent2: {
          DEFAULT: "#ffa247",
          soft: "#ffc185",
          dim: "#f07e0f",
        },
        support: { DEFAULT: "#9a8dce", soft: "#b9b0de" },
        good: "#3ad9b7",
        warn: "#f2cf4c",
        bad: "#ff6b6b",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "20px",
      },
      boxShadow: {
        // Material-style layered elevation — two shadows per level (a tight
        // "contact" shadow plus a soft ambient one) rather than a single
        // flat blur, which is what makes elevation read as physical depth.
        "elevation-1": "0 1px 2px rgba(0,0,0,0.24), 0 1px 1px rgba(0,0,0,0.16)",
        "elevation-2": "0 2px 6px rgba(0,0,0,0.28), 0 4px 16px -4px rgba(0,0,0,0.32)",
        "elevation-3": "0 6px 16px rgba(0,0,0,0.32), 0 12px 32px -8px rgba(0,0,0,0.4)",
        "elevation-accent": "0 4px 20px -4px rgba(124,92,255,0.35), 0 2px 8px -2px rgba(124,92,255,0.25)",
        "glow-accent": "0 0 0 1px rgba(124,92,255,0.4), 0 0 24px rgba(124,92,255,0.25)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(124,92,255,0.35)" },
          "100%": { boxShadow: "0 0 0 8px rgba(124,92,255,0)" },
        },
        "expand-ring": {
          "0%": { transform: "scale(0.7)", opacity: "0.5" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        "packet-travel": {
          "0%": { left: "0%", opacity: "0" },
          "8%": { opacity: "1" },
          "92%": { opacity: "1" },
          "100%": { left: "100%", opacity: "0" },
        },
        drift: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(3%, -4%) scale(1.06)" },
          "66%": { transform: "translate(-2%, 3%) scale(0.98)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        ripple: {
          "0%": { transform: "scale(0)", opacity: "0.45" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        "count-glow": {
          "0%": { textShadow: "0 0 0 rgba(124,92,255,0)" },
          "40%": { textShadow: "0 0 18px rgba(124,92,255,0.5)" },
          "100%": { textShadow: "0 0 0 rgba(124,92,255,0)" },
        },
        "flow-dash": {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "16px 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fade-in 0.4s ease both",
        shimmer: "shimmer 1.6s linear infinite",
        "pulse-ring": "pulse-ring 1.4s cubic-bezier(0.4,0,0.6,1) infinite",
        "expand-ring": "expand-ring 2.4s cubic-bezier(0.16,1,0.3,1) infinite",
        "packet-travel": "packet-travel 1.1s cubic-bezier(0.4,0,0.2,1) infinite",
        drift: "drift 18s ease-in-out infinite",
        "drift-slow": "drift 26s ease-in-out infinite reverse",
        "scale-in": "scale-in 0.35s cubic-bezier(0.16,1,0.3,1) both",
        ripple: "ripple 0.6s ease-out forwards",
        "count-glow": "count-glow 0.8s ease-out",
        "flow-dash": "flow-dash 0.6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
