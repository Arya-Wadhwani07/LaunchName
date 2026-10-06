/**
 * Raw design tokens — the single source of truth for color, spacing,
 * radius, shadow, and motion values across LaunchName. theme.ts turns
 * these into an MUI theme; nothing else in the app should hardcode a hex
 * value, a spacing number, or a transition duration outside this file.
 *
 * Visual identity: "premium infrastructure for the agentic internet" —
 * a near-black, cool-tinted dark surface, one confident violet primary,
 * one sparingly-used magenta secondary, and a strict typographic scale.
 * Not a Linear/Vercel/Stripe clone — those inform the restraint, not the
 * palette.
 */

/**
 * Golden-ratio palette (φ = 1.618…):
 * - Hues are spaced by the golden angle (360°/φ² ≈ 137.5°) from the brand
 *   violet at 252°: violet 252° → amber 29.5° → teal 167°. Golden-angle
 *   spacing keeps hues maximally distinct from each other.
 * - Neutral lightness grows by ×φ per step (3.6 → 5.8 → 9.4 → 15.2 → 24.7%),
 *   and text lightness falls by ÷√φ and ÷φ from near-white.
 * - Usage follows the golden split: ~62% neutral surfaces, ~24% violet,
 *   ~14% amber/teal accents.
 */
export const color = {
  canvas: "#08080a",
  surface: {
    default: "#0e0d11",
    raised: "#16151b",
    overlay: "#1d1b24",
    border: "#23212b",
    borderStrong: "#3a3648",
  },
  ink: {
    primary: "#f6f6f9",
    secondary: "#bfbcc9",
    disabled: "#9491a1",
  },
  primary: {
    main: "#7c5cff",
    light: "#a18aff",
    dark: "#5d3fd5",
    contrastText: "#f6f6f9",
  },
  // Support color per the golden-ratio formula: base hue (252°), saturation
  // reduced ~60% (100% → 40%). Softer partner to the violet for labels.
  support: { main: "#9a8dce", light: "#b9b0de" },
  secondary: {
    main: "#ffa247",
    light: "#ffc185",
    dark: "#f07e0f",
    contrastText: "#08080a",
  },
  success: { main: "#3ad9b7", dark: "#1eb897", contrastText: "#08080a" },
  warning: { main: "#f2cf4c", dark: "#d9b02a", contrastText: "#08080a" },
  error: { main: "#ff6b6b", dark: "#e04f4f", contrastText: "#08080a" },
  info: { main: "#5c9dff", dark: "#3f7de0", contrastText: "#08080a" },
} as const;

/**
 * Base spacing unit is 4px, so `theme.spacing(n)` in MUI reproduces this
 * scale exactly: spacing(1)=4, spacing(2)=8, spacing(3)=12, spacing(4)=16,
 * spacing(6)=24, spacing(8)=32, spacing(12)=48, spacing(16)=64, spacing(24)=96.
 */
export const spacingBaseUnit = 4;
export const spacingScale = [4, 8, 12, 16, 24, 32, 48, 64, 96] as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  pill: 999,
} as const;

/** Motion durations in ms, per the three-tier system: micro / normal / large. */
export const motion = {
  duration: {
    micro: 150,
    normal: 250,
    large: 420,
  },
  easing: {
    standard: "cubic-bezier(0.4, 0, 0.2, 1)",
    decelerate: "cubic-bezier(0.16, 1, 0.3, 1)",
    accelerate: "cubic-bezier(0.4, 0, 1, 1)",
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
} as const;

export const font = {
  display: "var(--font-display), Georgia, 'Times New Roman', serif",
  sans: "var(--font-inter), system-ui, sans-serif",
  mono: "var(--font-mono), ui-monospace, SFMono-Regular, monospace",
} as const;

/** Named z-index layers, so overlays never fight each other by accident. */
export const zIndex = {
  appBar: 1100,
  drawer: 1200,
  dialog: 1300,
  snackbar: 1400,
  tooltip: 1500,
} as const;
