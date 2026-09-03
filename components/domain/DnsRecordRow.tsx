"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import AlternateEmailOutlinedIcon from "@mui/icons-material/AlternateEmailOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import DnsOutlinedIcon from "@mui/icons-material/DnsOutlined";
import { Badge } from "@/components/ui/primitives";
import { Td, Tr } from "@/components/ui/data";
import { DISCOVERY_TXT_HOST_PREFIX } from "@/lib/agents/manifest";
import type { DnsRecord } from "@/lib/namecom/types";

export function DnsRecordRow({
  record,
  onEdit,
  onDelete,
  deleting,
}: {
  record: DnsRecord;
  onEdit: (record: DnsRecord) => void;
  onDelete: (record: DnsRecord) => void;
  deleting?: boolean;
}) {
  return (
    <Tr>
      <Td>
        <Badge variant="accent">{record.type}</Badge>
      </Td>
      <Td className="font-mono text-[13px]">{record.host || "@"}</Td>
      <Td className="max-w-[280px] truncate font-mono text-[13px] text-ink-muted" title={record.answer}>
        {record.answer}
        {record.priority !== undefined && <span className="ml-2 text-ink-faint">prio {record.priority}</span>}
      </Td>
      <Td className="text-ink-faint">{record.ttl}s</Td>
      <Td>
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
          <Tooltip title="Edit record">
            <IconButton size="small" onClick={() => onEdit(record)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete record">
            <IconButton size="small" onClick={() => onDelete(record)} disabled={deleting} sx={{ "&:hover": { color: "error.main", backgroundColor: "rgba(255,107,107,0.1)" } }}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Td>
    </Tr>
  );
}

const FRIENDLY_META: Record<string, { title: string; description: string; icon: React.ReactNode }> = {
  A: { title: "Website", description: "Where your site's traffic is routed", icon: <LanguageOutlinedIcon fontSize="small" /> },
  CNAME: { title: "Website alias", description: "Points a subdomain at your site", icon: <LanguageOutlinedIcon fontSize="small" /> },
  MX: { title: "Email", description: "Where your email is delivered", icon: <AlternateEmailOutlinedIcon fontSize="small" /> },
  TXT: { title: "Verification", description: "Ownership / verification record", icon: <VerifiedOutlinedIcon fontSize="small" /> },
  AAAA: { title: "Website (IPv6)", description: "IPv6 address for your site", icon: <LanguageOutlinedIcon fontSize="small" /> },
  ANAME: { title: "Website (root alias)", description: "Root-domain alias to a hostname", icon: <LanguageOutlinedIcon fontSize="small" /> },
  NS: { title: "Nameservers", description: "Delegates a subdomain to other DNS servers", icon: <DnsOutlinedIcon fontSize="small" /> },
  SRV: { title: "Service", description: "Points a service to a host and port", icon: <DnsOutlinedIcon fontSize="small" /> },
};

function isAgentDiscoveryRecord(record: DnsRecord): boolean {
  return record.type === "TXT" && Boolean(record.host) && (record.host === DISCOVERY_TXT_HOST_PREFIX || record.host!.startsWith(`${DISCOVERY_TXT_HOST_PREFIX}.`));
}

export function FriendlyDnsCard({ record }: { record: DnsRecord }) {
  const meta = isAgentDiscoveryRecord(record)
    ? { title: "Agent discovery", description: "Points AI agents at this domain's LaunchName manifest", icon: <HubOutlinedIcon fontSize="small" /> }
    : (record.type && FRIENDLY_META[record.type]) || { title: record.type ?? "Record", description: "", icon: <DnsOutlinedIcon fontSize="small" /> };
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        borderRadius: 1.5,
        border: 1,
        borderColor: "divider",
        backgroundColor: "background.paper",
        px: 2,
        py: 1.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
        <Box sx={{ display: "flex", color: "primary.light" }}>{meta.icon}</Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>
            {meta.title}
          </Typography>
          <Typography variant="caption">{meta.description}</Typography>
        </Box>
      </Box>
      <Box sx={{ textAlign: "right", minWidth: 0 }}>
        <Typography variant="mono" sx={{ fontSize: "0.6875rem", color: "text.secondary", display: "block" }}>
          {record.host || "@"}
        </Typography>
        <Typography variant="mono" noWrap sx={{ fontSize: "0.6875rem", color: "text.disabled", maxWidth: 220, display: "block" }}>
          {record.answer}
        </Typography>
      </Box>
    </Box>
  );
}
