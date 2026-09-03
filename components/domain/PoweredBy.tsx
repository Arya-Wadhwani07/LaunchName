import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export function PoweredByBadge({ className }: { className?: string }) {
  return (
    <Box
      className={className}
      sx={{
        display: "inline-flex",
        flexShrink: 0,
        alignItems: "center",
        gap: 0.75,
        whiteSpace: "nowrap",
        borderRadius: 999,
        border: 1,
        borderColor: "divider",
        backgroundColor: "background.paper",
        px: 1.25,
        py: 0.5,
      }}
    >
      <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "primary.main" }} />
      <Typography variant="caption" sx={{ color: "text.disabled" }}>
        Powered by <Box component="span" sx={{ fontWeight: 500, color: "text.secondary" }}>name.com</Box>
      </Typography>
    </Box>
  );
}
