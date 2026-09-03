"use client";

import { createContext, useCallback, useContext, useState } from "react";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { Button } from "@/components/ui/primitives";

interface ToastMessage {
  id: string;
  message: string;
  variant: "default" | "success" | "error";
}

const ToastContext = createContext<{ push: (message: string, variant?: ToastMessage["variant"]) => void } | null>(null);

/**
 * One notification visible at a time, MUI Snackbar/Alert-driven — queued
 * rather than stacked, so a burst of events (e.g. DNS record + activity
 * log) never piles boxes on top of each other.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<ToastMessage[]>([]);
  const [current, setCurrent] = useState<ToastMessage | null>(null);
  const [open, setOpen] = useState(false);

  const push = useCallback((message: string, variant: ToastMessage["variant"] = "default") => {
    const item: ToastMessage = { id: Math.random().toString(36).slice(2), message, variant };
    setQueue((q) => [...q, item]);
  }, []);

  if (!current && queue.length > 0) {
    setCurrent(queue[0]);
    setQueue((q) => q.slice(1));
    setOpen(true);
  }

  function handleClose(_?: unknown, reason?: string) {
    if (reason === "clickaway") return;
    setOpen(false);
  }

  function handleExited() {
    setCurrent(null);
  }

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4200}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        slotProps={{ transition: { onExited: handleExited } }}
      >
        <MuiAlert
          onClose={handleClose}
          severity={current?.variant === "default" ? "info" : current?.variant ?? "info"}
          variant="outlined"
          sx={{ backgroundColor: "background.paper" }}
        >
          {current?.message}
        </MuiAlert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        borderRadius: 2,
        border: "1px dashed",
        borderColor: "divider",
        px: 4,
        py: 7,
        textAlign: "center",
      }}
    >
      {icon && <Box sx={{ color: "text.disabled" }}>{icon}</Box>}
      <Box>
        <Typography variant="body1" sx={{ fontWeight: 500, color: "text.primary" }}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" sx={{ mt: 0.5, maxWidth: 380, mx: "auto" }}>
            {description}
          </Typography>
        )}
      </Box>
      {action}
    </Box>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "rgba(255,107,107,0.2)",
        backgroundColor: "rgba(255,107,107,0.05)",
        px: 4,
        py: 5,
        textAlign: "center",
      }}
    >
      <Typography variant="body1" sx={{ fontWeight: 500, color: "error.main" }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ maxWidth: 380 }}>
          {description}
        </Typography>
      )}
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </Box>
  );
}

/**
 * A contextual loading message rather than a bare spinner — per screen,
 * this should describe what's actually happening ("Checking availability…",
 * "Securing your domain…") so waiting reads as progress, not a stall.
 */
export function LoadingState({ label }: { label: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, py: 5 }}>
      <CircularProgress size={18} thickness={4.5} sx={{ color: "primary.main" }} />
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
    </Box>
  );
}
