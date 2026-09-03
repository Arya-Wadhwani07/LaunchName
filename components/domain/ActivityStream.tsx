import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export interface ActivityItem {
  id: string;
  timestamp: string;
  message: string;
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return iso;
  }
}

/** A connected timeline (dot + line, not a bare list) — each new event fades/slides in via the shared stagger utility so a burst of activity reads as a sequence, not a jump-cut. */
export function ActivityStream({ events }: { events: ActivityItem[] }) {
  if (events.length === 0) {
    return (
      <Typography variant="caption" sx={{ display: "block", textAlign: "center", py: 3 }}>
        Activity will appear here as you go.
      </Typography>
    );
  }
  return (
    <Box component="ol" sx={{ m: 0, p: 0, listStyle: "none" }}>
      {events.map((event, i) => (
        <Box
          component="li"
          key={event.id}
          className="stagger-item"
          style={{ "--stagger-index": Math.min(i, 8) } as React.CSSProperties}
          sx={{ display: "flex", gap: 1.5, position: "relative", pb: i === events.length - 1 ? 0 : 2.5 }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
            <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "primary.main", mt: 0.5, boxShadow: (t) => `0 0 0 3px ${t.palette.background.paper}` }} />
            {i < events.length - 1 && <Box sx={{ width: "1px", flex: 1, backgroundColor: "divider", mt: 0.5 }} />}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="mono" sx={{ fontSize: "0.6875rem", color: "text.disabled", display: "block" }}>
              {formatTime(event.timestamp)}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
              {event.message}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
