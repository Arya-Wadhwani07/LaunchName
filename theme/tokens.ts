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

export const color = {
  canvas: "#08080d",
  surface: {
    default: "#121218",
    raised: "#191920",
    overlay: "#1e1e27",
    border: "#26262f",
    borderStrong: "#33333f",
  },
  ink: {
    primary: "#f6f6f8",
    secondary: "#a5a5b3",
    disabled: "#5c5c68",
  },
  primary: {
    main: "#7c5cff",
    light: "#a98bff",
    dark: "#5b3fd6",
    contrastText: "#f6f6f8",
  },
  secondary: {
    main: "#ff5cad",
    light: "#ff8cc6",
    dark: "#d6398a",
    contrastText: "#f6f6f8",
  },
  success: { main: "#3ddc97", dark: "#2bb87c", contrastText: "#08080d" },
  warning: { main: "#f5b942", dark: "#d9992a", contrastText: "#08080d" },
  error: { main: "#ff6b6b", dark: "#e04f4f", contrastText: "#08080d" },
  info: { main: "#5c9dff", dark: "#3f7de0", contrastText: "#08080d" },
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
