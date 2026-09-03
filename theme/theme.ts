import { createTheme, type ThemeOptions } from "@mui/material/styles";
import { color, spacingBaseUnit, radius, motion, font } from "./tokens";
import { buildComponents } from "./components";

// Custom typography variants beyond MUI's defaults — "display" for hero
// headlines, "mono" for domains/DNS/endpoints/API events. Module
// augmentation is the correct MUI pattern for adding variants rather than
// repurposing an existing one.
declare module "@mui/material/styles" {
  interface TypographyVariants {
    display: React.CSSProperties;
    mono: React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    display?: React.CSSProperties;
    mono?: React.CSSProperties;
  }
}
declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    display: true;
    mono: true;
  }
}

/** MUI requires exactly 25 shadow strings (index 0 = none). A restrained, dark-appropriate elevation scale — two-tone (tight contact shadow + soft ambient) at the levels the app actually uses (1-3, 8, 16), flat interpolation elsewhere so nothing looks stepped. */
function buildShadows(): ThemeOptions["shadows"] {
  const flat = "0 1px 2px rgba(0,0,0,0.2)";
  const shadows: string[] = [
    "none",
    "0 1px 2px rgba(0,0,0,0.24), 0 1px 1px rgba(0,0,0,0.16)",
    "0 1px 3px rgba(0,0,0,0.26), 0 2px 6px -2px rgba(0,0,0,0.2)",
    "0 2px 6px rgba(0,0,0,0.28), 0 4px 16px -4px rgba(0,0,0,0.32)",
  ];
  for (let i = 4; i <= 24; i++) {
    const blur = 8 + i * 2.5;
    const spread = -Math.min(i, 12);
    const opacity = Math.min(0.15 + i * 0.01, 0.45);
    shadows.push(`0 ${Math.min(6 + i, 32)}px ${blur}px ${spread}px rgba(0,0,0,${opacity.toFixed(2)})`);
  }
  return shadows as ThemeOptions["shadows"];
}

const base = createTheme({
  spacing: spacingBaseUnit,
  palette: {
    mode: "dark",
    primary: color.primary,
    secondary: color.secondary,
    success: color.success,
    warning: color.warning,
    error: color.error,
    info: color.info,
    background: {
      default: color.canvas,
      paper: color.surface.default,
    },
    text: {
      primary: color.ink.primary,
      secondary: color.ink.secondary,
      disabled: color.ink.disabled,
    },
    divider: color.surface.border,
  },
  shape: {
    borderRadius: radius.md,
  },
  typography: {
    fontFamily: font.sans,
    display: {
      fontFamily: font.sans,
      fontWeight: 600,
      fontSize: "clamp(2.5rem, 2rem + 2vw, 3.75rem)",
      lineHeight: 1.08,
      letterSpacing: "-0.02em",
    },
    h1: { fontWeight: 600, fontSize: "2.5rem", lineHeight: 1.15, letterSpacing: "-0.015em" },
    h2: { fontWeight: 600, fontSize: "2rem", lineHeight: 1.2, letterSpacing: "-0.01em" },
    h3: { fontWeight: 600, fontSize: "1.5rem", lineHeight: 1.25, letterSpacing: "-0.005em" },
    h4: { fontWeight: 600, fontSize: "1.25rem", lineHeight: 1.3 },
    h5: { fontWeight: 600, fontSize: "1.0625rem", lineHeight: 1.35 },
    h6: { fontWeight: 600, fontSize: "0.9375rem", lineHeight: 1.4 },
    subtitle1: { fontSize: "1rem", lineHeight: 1.5, color: color.ink.secondary },
    subtitle2: { fontSize: "0.875rem", lineHeight: 1.5, fontWeight: 500, color: color.ink.secondary },
    body1: { fontSize: "0.9375rem", lineHeight: 1.6 },
    body2: { fontSize: "0.8125rem", lineHeight: 1.55, color: color.ink.secondary },
    button: { fontWeight: 500, textTransform: "none", letterSpacing: 0 },
    caption: { fontSize: "0.75rem", lineHeight: 1.5, color: color.ink.disabled },
    overline: {
      fontSize: "0.6875rem",
      fontWeight: 600,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: color.primary.light,
    },
    mono: {
      fontFamily: font.mono,
      fontSize: "0.875rem",
      fontWeight: 400,
      letterSpacing: 0,
    },
  },
  shadows: buildShadows(),
  transitions: {
    duration: {
      shortest: motion.duration.micro,
      shorter: motion.duration.micro,
      short: motion.duration.normal,
      standard: motion.duration.normal,
      complex: motion.duration.large,
      enteringScreen: motion.duration.normal,
      leavingScreen: motion.duration.micro,
    },
    easing: {
      easeInOut: motion.easing.standard,
      easeOut: motion.easing.decelerate,
      easeIn: motion.easing.accelerate,
      sharp: motion.easing.standard,
    },
  },
});

export const theme = createTheme(base, {
  components: buildComponents(base),
});

export type AppTheme = typeof theme;
