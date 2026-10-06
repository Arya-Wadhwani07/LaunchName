"use client";

import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { QuestionIcon } from "@phosphor-icons/react";

/**
 * A "?" next to an option that explains it. It's a real button (not a bare
 * icon) so the explanation opens on hover, keyboard focus, and tap alike.
 */
export function HelpTip({ label, title, children }: { label: string; title?: string; children: React.ReactNode }) {
  return (
    <Tooltip
      arrow
      enterTouchDelay={0}
      leaveTouchDelay={6000}
      placement="top"
      title={
        <span style={{ display: "block", maxWidth: 260, padding: "2px 0" }}>
          {title && (
            <Typography component="span" sx={{ display: "block", fontWeight: 600, fontSize: "0.75rem", mb: 0.5, color: "text.primary" }}>
              {title}
            </Typography>
          )}
          <Typography component="span" sx={{ display: "block", fontSize: "0.75rem", lineHeight: 1.5, color: "text.secondary" }}>
            {children}
          </Typography>
        </span>
      }
    >
      <IconButton
        size="small"
        aria-label={`What is ${label}?`}
        onClick={(e) => e.stopPropagation()}
        sx={{ p: 0.25, ml: 0.25, color: "text.disabled", "&:hover, &:focus-visible": { color: "primary.light", backgroundColor: "transparent" } }}
      >
        <QuestionIcon size={15} aria-hidden />
      </IconButton>
    </Tooltip>
  );
}
