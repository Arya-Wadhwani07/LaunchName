"use client";

import MuiDialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import MuiDrawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import Slide from "@mui/material/Slide";
import type { TransitionProps } from "@mui/material/transitions";
import { forwardRef } from "react";

const SlideUp = forwardRef(function SlideUp(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <MuiDialog open={open} onClose={onClose} maxWidth="xs" fullWidth slots={{ transition: SlideUp }} keepMounted>
      {title && (
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.75 }}>
          {/* DialogTitle already renders an <h2> — nesting another heading
              tag (Typography's h6 default) inside it is invalid HTML and
              triggers a hydration warning, so this renders as a <span>. */}
          <Typography component="span" variant="h6">
            {title}
          </Typography>
          <IconButton size="small" onClick={onClose} aria-label="Close" edge="end">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
      )}
      <DialogContent sx={{ pt: title ? 0 : 3 }}>{children}</DialogContent>
    </MuiDialog>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  width = 420,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: number | string;
}) {
  return (
    <MuiDrawer anchor="right" open={open} onClose={onClose} keepMounted>
      <Box sx={{ width, maxWidth: "100vw", display: "flex", flexDirection: "column", height: "100%" }} role="presentation">
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, px: 2.5, borderBottom: 1, borderColor: "divider", flexShrink: 0 }}>
          <Typography variant="overline">{title}</Typography>
          <IconButton size="small" onClick={onClose} aria-label="Close">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box className="scrollbar-thin" sx={{ flex: 1, overflowY: "auto", p: 2.5 }}>
          {children}
        </Box>
      </Box>
    </MuiDrawer>
  );
}
