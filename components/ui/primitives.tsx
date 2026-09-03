"use client";

import { forwardRef } from "react";
import MuiButton, { type ButtonProps as MuiButtonProps } from "@mui/material/Button";
import MuiTextField, { type TextFieldProps } from "@mui/material/TextField";
import MuiCard from "@mui/material/Card";
import MuiChip from "@mui/material/Chip";
import MuiSelect from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MuiSwitch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import { cn } from "@/lib/cn";

/**
 * Thin, semantically-named wrappers over MUI primitives. The point isn't
 * to hide MUI — every one of these renders a real MUI component styled by
 * theme/components.ts — it's to keep the ~30 call sites across the app
 * using the same prop vocabulary (variant="secondary", not
 * variant="outlined" + color="inherit") so the vocabulary matches the
 * product's own language instead of MUI's generic one.
 */

const BUTTON_VARIANT_MAP: Record<string, { variant: MuiButtonProps["variant"]; color?: MuiButtonProps["color"] }> = {
  primary: { variant: "contained" },
  secondary: { variant: "outlined" },
  ghost: { variant: "text" },
  danger: { variant: "contained", color: "secondary" },
};

export const Button = forwardRef<
  HTMLButtonElement,
  Omit<MuiButtonProps, "variant" | "color" | "size"> & {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
  }
>(({ variant = "primary", size = "md", className, sx, ...props }, ref) => {
  const mapped = BUTTON_VARIANT_MAP[variant];
  const muiSize = size === "sm" ? "small" : size === "lg" ? "large" : "medium";
  return (
    <MuiButton
      ref={ref}
      variant={mapped.variant}
      color={variant === "danger" ? undefined : mapped.color}
      size={muiSize}
      className={className}
      sx={variant === "danger" ? { backgroundColor: (t) => alpha(t.palette.error.main, 0.1), color: "error.main", "&:hover": { backgroundColor: (t) => alpha(t.palette.error.main, 0.18) }, ...sx } : sx}
      {...props}
    />
  );
});
Button.displayName = "Button";

export const Input = forwardRef<HTMLInputElement, Omit<TextFieldProps, "variant" | "label" | "error"> & { label?: string; error?: string; hint?: string }>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <MuiTextField
        inputRef={ref}
        variant="outlined"
        fullWidth
        label={label}
        error={Boolean(error)}
        helperText={error ?? hint}
        className={className}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export function Card({
  className,
  interactive,
  sx,
  ...props
}: React.ComponentProps<typeof MuiCard> & { interactive?: boolean }) {
  return (
    <MuiCard
      className={className}
      sx={{
        ...(interactive && {
          cursor: "pointer",
          "&:hover": { transform: "translateY(-3px)", boxShadow: (t) => t.shadows[3], borderColor: "rgba(255,255,255,0.15)" },
        }),
        ...sx,
      }}
      {...props}
    />
  );
}

const BADGE_VARIANT_SX = {
  available: { color: "success.main", borderColor: alpha("#3ddc97", 0.25), backgroundColor: alpha("#3ddc97", 0.1) },
  taken: { color: "text.disabled", borderColor: "divider", backgroundColor: "action.hover" },
  premium: { color: "warning.main", borderColor: alpha("#f5b942", 0.25), backgroundColor: alpha("#f5b942", 0.1) },
  error: { color: "error.main", borderColor: alpha("#ff6b6b", 0.25), backgroundColor: alpha("#ff6b6b", 0.1) },
  neutral: { color: "text.secondary", borderColor: "divider", backgroundColor: "background.paper" },
  accent: { color: "primary.light", borderColor: alpha("#7c5cff", 0.25), backgroundColor: alpha("#7c5cff", 0.1) },
} as const;

export function Badge({
  variant = "neutral",
  className,
  children,
  sx,
}: {
  variant?: keyof typeof BADGE_VARIANT_SX;
  className?: string;
  children: React.ReactNode;
  sx?: object;
}) {
  return (
    <MuiChip
      label={children}
      variant="outlined"
      size="small"
      className={className}
      sx={{
        textTransform: "uppercase",
        ...BADGE_VARIANT_SX[variant],
        ...sx,
      }}
    />
  );
}

export function Select({
  className,
  label,
  children,
  value,
  onChange,
  ...props
}: {
  className?: string;
  label?: string;
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  children: React.ReactNode;
}) {
  const id = label ? `select-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined;
  return (
    <FormControl fullWidth size="small" className={className}>
      {label && <InputLabel id={id}>{label}</InputLabel>}
      <MuiSelect labelId={id} label={label} value={value} onChange={(e) => onChange({ target: { value: String(e.target.value) } })} {...props}>
        {children}
      </MuiSelect>
    </FormControl>
  );
}
export { MenuItem as Option };

export function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  const theme = useTheme();
  return (
    <Box
      onClick={() => onChange(!checked)}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        width: "100%",
        borderRadius: 1,
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: "background.default",
        px: 1.5,
        py: 1,
        cursor: "pointer",
        transition: `border-color 150ms ease`,
        "&:hover": { borderColor: alpha(theme.palette.text.primary, 0.2) },
      }}
    >
      <Box>
        <Typography variant="body1" color="text.primary" sx={{ fontSize: "0.875rem" }}>
          {label}
        </Typography>
        {hint && (
          <Typography variant="caption" component="div">
            {hint}
          </Typography>
        )}
      </Box>
      <MuiSwitch checked={checked} onChange={() => onChange(!checked)} onClick={(e) => e.stopPropagation()} />
    </Box>
  );
}
