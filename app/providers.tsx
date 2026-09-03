"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "@/theme/theme";
import { ToastProvider } from "@/components/ui/status";

/**
 * The one place that wires up MUI for the whole app: Emotion's cache
 * provider (so styles are correctly extracted during SSR instead of
 * flashing unstyled on first paint), the centralized theme, and
 * CssBaseline for a consistent reset. ToastProvider (notifications) lives
 * inside so anything it renders can use the theme too.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
