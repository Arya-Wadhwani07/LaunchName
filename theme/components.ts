import type { Components, Theme } from "@mui/material/styles";
import { color, radius, motion } from "./tokens";

/**
 * Centralized component overrides — this is what the build brief calls
 * "MUI theme customization instead of scattering styling values." Every
 * component in the app should get its look from here, not from one-off
 * sx props duplicating colors/radii/shadows already defined in tokens.ts.
 */
export function buildComponents(theme: Theme): Components<Theme> {
  return {
    MuiCssBaseline: {
      styleOverrides: {
        "*": { boxSizing: "border-box" },
        html: { colorScheme: "dark" },
        body: {
          backgroundColor: color.canvas,
          fontFeatureSettings: '"cv11", "ss01"',
          textRendering: "optimizeLegibility",
          WebkitFontSmoothing: "antialiased",
        },
        "::selection": { backgroundColor: "rgba(124, 92, 255, 0.35)" },
        // Restores the anchor reset Tailwind's Preflight used to provide
        // (disabled in tailwind.config.ts now that CssBaseline is the
        // single reset authority) — without it, plain <a>/<Link> elements
        // that don't set their own color/text-decoration fall back to the
        // browser's default blue-underline UA styles.
        a: { color: "inherit", textDecoration: "inherit" },
        "@media (prefers-reduced-motion: reduce)": {
          "*, *::before, *::after": {
            animationDuration: "0.001ms !important",
            animationIterationCount: "1 !important",
            transitionDuration: "0.001ms !important",
          },
        },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          fontWeight: 500,
          padding: "8px 18px",
          transition: `transform ${motion.duration.micro}ms ${motion.easing.decelerate}, box-shadow ${motion.duration.micro}ms ${motion.easing.decelerate}, background-color ${motion.duration.micro}ms ease, border-color ${motion.duration.micro}ms ease`,
          "&:active": { transform: "scale(0.98)" },
        },
        sizeLarge: { padding: "12px 24px", fontSize: "0.9375rem", borderRadius: radius.lg },
        sizeSmall: { padding: "5px 12px", fontSize: "0.8125rem" },
        contained: {
          backgroundColor: color.ink.primary,
          color: color.canvas,
          "&:hover": {
            backgroundColor: "#ffffff",
            transform: "translateY(-1px)",
            boxShadow: theme.shadows[2],
          },
        },
        outlined: {
          borderColor: color.surface.border,
          backgroundColor: color.surface.raised,
          color: color.ink.primary,
          "&:hover": {
            borderColor: color.surface.borderStrong,
            backgroundColor: color.surface.overlay,
            transform: "translateY(-1px)",
            boxShadow: theme.shadows[1],
          },
        },
        text: {
          color: color.ink.secondary,
          "&:hover": { backgroundColor: color.surface.raised, color: color.ink.primary },
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: `transform ${motion.duration.micro}ms ${motion.easing.decelerate}, background-color ${motion.duration.micro}ms ease`,
          "&:hover": { backgroundColor: color.surface.raised },
          "&:active": { transform: "scale(0.92)" },
        },
      },
    },

    MuiTextField: { defaultProps: { size: "small" } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          backgroundColor: color.surface.default,
          transition: `border-color ${motion.duration.micro}ms ease, box-shadow ${motion.duration.micro}ms ease`,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: color.surface.border },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: color.surface.borderStrong },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: color.primary.main, borderWidth: 1.5 },
        },
        input: { color: color.ink.primary },
      },
    },
    MuiInputLabel: { styleOverrides: { root: { color: color.ink.secondary } } },
    MuiFormHelperText: { styleOverrides: { root: { marginLeft: 2 } } },

    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: color.surface.default,
          border: `1px solid ${color.surface.border}`,
        },
      },
    },

    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: color.surface.default,
          border: `1px solid ${color.surface.border}`,
          borderRadius: radius.lg,
          boxShadow: theme.shadows[1],
          // Paper (which Card extends) defaults to overflow: hidden — several
          // cards intentionally hang a badge slightly above the top edge
          // (e.g. "Best pick"), which that would clip.
          overflow: "visible",
          transition: `transform ${motion.duration.normal}ms ${motion.easing.decelerate}, box-shadow ${motion.duration.normal}ms ${motion.easing.decelerate}, border-color ${motion.duration.normal}ms ease`,
        },
      },
    },
    MuiCardContent: { styleOverrides: { root: { padding: 20, "&:last-child": { paddingBottom: 20 } } } },
    MuiCardActionArea: {
      styleOverrides: {
        root: {
          "&:hover": {
            transform: "translateY(-3px)",
            boxShadow: theme.shadows[3],
          },
          "& .MuiCardActionArea-focusHighlight": { backgroundColor: "transparent" },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: radius.pill,
          fontWeight: 500,
          fontSize: "0.6875rem",
          letterSpacing: "0.02em",
        },
        sizeSmall: { height: 22 },
        outlined: { borderColor: color.surface.border },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: radius.xl,
          backgroundColor: color.surface.overlay,
          backgroundImage: "none",
          border: `1px solid ${color.surface.border}`,
          boxShadow: theme.shadows[16],
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: { backgroundColor: "rgba(4,4,8,0.72)", backdropFilter: "blur(4px)" },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: color.surface.overlay,
          backgroundImage: "none",
          border: "none",
          borderLeft: `1px solid ${color.surface.border}`,
        },
      },
    },

    MuiTable: { styleOverrides: { root: { borderCollapse: "separate", borderSpacing: 0 } } },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-root": {
            color: color.ink.disabled,
            fontSize: "0.6875rem",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            backgroundColor: color.surface.raised,
            borderBottom: `1px solid ${color.surface.border}`,
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: `background-color ${motion.duration.micro}ms ease`,
          "&:hover": { backgroundColor: color.surface.raised },
          "&:last-child .MuiTableCell-root": { borderBottom: "none" },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: { root: { borderBottom: `1px solid ${color.surface.border}`, padding: "12px 16px" } },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: color.surface.overlay,
          border: `1px solid ${color.surface.border}`,
          color: color.ink.primary,
          fontSize: "0.75rem",
          borderRadius: radius.sm,
          boxShadow: theme.shadows[3],
        },
        arrow: { color: color.surface.overlay },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: radius.md, border: "1px solid transparent" },
        colorSuccess: { backgroundColor: "rgba(61,220,151,0.1)", borderColor: "rgba(61,220,151,0.25)", color: color.success.main },
        colorError: { backgroundColor: "rgba(255,107,107,0.1)", borderColor: "rgba(255,107,107,0.25)", color: color.error.main },
        colorWarning: { backgroundColor: "rgba(245,185,66,0.1)", borderColor: "rgba(245,185,66,0.25)", color: color.warning.main },
        colorInfo: { backgroundColor: "rgba(124,92,255,0.1)", borderColor: "rgba(124,92,255,0.25)", color: color.primary.light },
      },
    },

    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 40 },
        indicator: { height: 2, borderRadius: 2, backgroundColor: color.primary.main },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          minHeight: 40,
          fontSize: "0.8125rem",
          fontWeight: 500,
          color: color.ink.secondary,
          transition: `color ${motion.duration.micro}ms ease`,
          "&.Mui-selected": { color: color.ink.primary },
        },
      },
    },

    MuiStepIcon: {
      styleOverrides: {
        root: {
          color: color.surface.raised,
          border: `1px solid ${color.surface.border}`,
          borderRadius: "50%",
          "&.Mui-active": { color: color.primary.main },
          "&.Mui-completed": { color: color.success.main },
        },
        text: { fill: color.ink.primary },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: {
          color: color.ink.disabled,
          fontSize: "0.8125rem",
          "&.Mui-active": { color: color.ink.primary, fontWeight: 500 },
          "&.Mui-completed": { color: color.ink.secondary },
        },
      },
    },
    MuiStepConnector: {
      styleOverrides: { line: { borderColor: color.surface.border } },
    },

    MuiSwitch: {
      styleOverrides: {
        root: { padding: 8 },
        switchBase: {
          transitionDuration: `${motion.duration.normal}ms`,
          "&.Mui-checked": { color: "#fff" },
          "&.Mui-checked + .MuiSwitch-track": { backgroundColor: color.primary.main, opacity: 1 },
        },
        thumb: { boxShadow: theme.shadows[1] },
        track: { backgroundColor: color.surface.raised, opacity: 1, borderRadius: radius.pill },
      },
    },

    MuiSnackbar: { styleOverrides: { root: {} } },

    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: radius.pill, height: 4, backgroundColor: color.surface.raised },
        bar: { borderRadius: radius.pill },
      },
    },

    MuiSkeleton: {
      styleOverrides: {
        root: { backgroundColor: color.surface.raised, "&::after": { background: `linear-gradient(90deg, transparent, ${color.surface.overlay}, transparent)` } },
      },
    },

    MuiDivider: { styleOverrides: { root: { borderColor: color.surface.border } } },

    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: color.surface.overlay,
          border: `1px solid ${color.surface.border}`,
          borderRadius: radius.md,
        },
      },
    },
  };
}
