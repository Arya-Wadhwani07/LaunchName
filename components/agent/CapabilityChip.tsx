"use client";

import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { Button } from "@/components/ui/primitives";
import { alpha } from "@mui/material/styles";

export function CapabilityChip({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <Chip
      label={label}
      onDelete={onRemove}
      size="small"
      sx={{
        color: "primary.light",
        borderColor: (t) => alpha(t.palette.primary.main, 0.25),
        backgroundColor: (t) => alpha(t.palette.primary.main, 0.1),
        "& .MuiChip-deleteIcon": { color: "primary.light", opacity: 0.6, "&:hover": { opacity: 1 } },
      }}
      variant="outlined"
    />
  );
}

export function CapabilityInput({
  value,
  onChange,
  onAdd,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
  placeholder?: string;
}) {
  return (
    <Box sx={{ display: "flex", gap: 2 }}>
      <TextField
        size="small"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onAdd();
          }
        }}
        placeholder={placeholder}
        fullWidth
      />
      <Button variant="secondary" size="sm" onClick={onAdd} sx={{ flexShrink: 0 }}>
        Add
      </Button>
    </Box>
  );
}
