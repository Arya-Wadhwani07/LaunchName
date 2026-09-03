import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CheckIcon from "@mui/icons-material/Check";

export interface ChecklistItem {
  label: string;
  done: boolean;
}

export function LaunchChecklist({ items }: { items: ChecklistItem[] }) {
  return (
    <Box component="ul" sx={{ display: "flex", flexDirection: "column", gap: 1.25, m: 0, p: 0, listStyle: "none" }}>
      {items.map((item, i) => (
        <Box
          component="li"
          key={item.label}
          className="stagger-item"
          style={{ "--stagger-index": i } as React.CSSProperties}
          sx={{ display: "flex", alignItems: "center", gap: 1.25 }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 20,
              height: 20,
              flexShrink: 0,
              borderRadius: "50%",
              border: 1,
              borderColor: item.done ? "rgba(61,220,151,0.4)" : "divider",
              backgroundColor: item.done ? "rgba(61,220,151,0.1)" : "transparent",
              color: "success.main",
              transition: "background-color 250ms ease, border-color 250ms ease",
            }}
          >
            {item.done && <CheckIcon sx={{ fontSize: 13 }} />}
          </Box>
          <Typography variant="body2" sx={{ color: item.done ? "text.primary" : "text.disabled" }}>
            {item.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
