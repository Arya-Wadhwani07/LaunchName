"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { Button, Input, Select, Option } from "@/components/ui/primitives";
import { Table, THead, Th, Skeleton } from "@/components/ui/data";
import { Modal } from "@/components/ui/overlay";
import { EmptyState, ErrorState } from "@/components/ui/status";
import { useToast } from "@/components/ui/status";
import { DnsRecordRow, FriendlyDnsCard } from "@/components/domain/DnsRecordRow";
import type { DnsRecord, DnsRecordType } from "@/lib/namecom/types";
import { ArrowClockwiseIcon, PlusIcon } from "@phosphor-icons/react";

const RECORD_TYPES: DnsRecordType[] = ["A", "AAAA", "CNAME", "ANAME", "MX", "NS", "SRV", "TXT"];

interface DraftRecord {
  id?: number;
  type: DnsRecordType;
  host: string;
  answer: string;
  ttl: number;
  priority?: number;
}

const EMPTY_DRAFT: DraftRecord = { type: "A", host: "@", answer: "", ttl: 300 };

export function DnsManager({ domainName }: { domainName: string }) {
  const { push } = useToast();
  const [records, setRecords] = useState<DnsRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"friendly" | "advanced">("friendly");
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<DraftRecord>(EMPTY_DRAFT);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainName]);

  async function load() {
    setError(null);
    try {
      const res = await fetch(`/api/dns/records?domain=${encodeURIComponent(domainName)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Couldn't load DNS records.");
      setRecords(data.records);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  function openCreate() {
    setDraft(EMPTY_DRAFT);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(record: DnsRecord) {
    setDraft({
      id: record.id,
      type: (record.type ?? "A") as DnsRecordType,
      host: record.host ?? "@",
      answer: record.answer,
      ttl: record.ttl,
      priority: record.priority,
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function save() {
    setSaving(true);
    setFormError(null);
    try {
      const isEdit = draft.id !== undefined;
      const res = await fetch(isEdit ? `/api/dns/records/${draft.id}` : "/api/dns/records", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainName, type: draft.type, host: draft.host, answer: draft.answer, ttl: draft.ttl, priority: draft.priority }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Couldn't save that record.");
      setModalOpen(false);
      push(isEdit ? "Record updated" : "Record added", "success");
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(record: DnsRecord) {
    if (!record.id) return;
    setDeletingId(record.id);
    try {
      const res = await fetch(`/api/dns/records/${record.id}?domain=${encodeURIComponent(domainName)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Couldn't delete that record.");
      push("Record deleted", "success");
      load();
    } catch (err) {
      push(err instanceof Error ? err.message : "Something went wrong.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  const needsPriority = draft.type === "MX" || draft.type === "SRV";

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5, flexWrap: "wrap", gap: 1.5 }}>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, v) => v && setMode(v)}
          size="small"
          sx={{
            "& .MuiToggleButton-root": {
              textTransform: "none",
              px: 1.75,
              py: 0.5,
              fontSize: "0.75rem",
              color: "text.secondary",
              border: "none",
              "&.Mui-selected": { color: "text.primary", backgroundColor: "action.selected" },
            },
          }}
        >
          <ToggleButton value="friendly">Simple</ToggleButton>
          <ToggleButton value="advanced">Advanced</ToggleButton>
        </ToggleButtonGroup>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button size="sm" variant="ghost" onClick={load} startIcon={<ArrowClockwiseIcon size={18} aria-hidden />}>
            Refresh
          </Button>
          <Button size="sm" onClick={openCreate} startIcon={<PlusIcon size={18} aria-hidden />}>
            Add record
          </Button>
        </Box>
      </Box>

      {error && <ErrorState description={error} onRetry={load} />}

      {!error && !records && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </Box>
      )}

      {!error && records && records.length === 0 && (
        <EmptyState title="No DNS records yet" description="Add a record, or launch your site to configure DNS automatically." />
      )}

      {!error && records && records.length > 0 && mode === "friendly" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {records.map((r) => (
            <FriendlyDnsCard key={r.id} record={r} />
          ))}
        </Box>
      )}

      {!error && records && records.length > 0 && mode === "advanced" && (
        <Table>
          <THead>
            <Th>Type</Th>
            <Th>Host</Th>
            <Th>Value</Th>
            <Th>TTL</Th>
            <Th />
          </THead>
          <tbody>
            {records.map((r) => (
              <DnsRecordRow key={r.id} record={r} onEdit={openEdit} onDelete={remove} deleting={deletingId === r.id} />
            ))}
          </tbody>
        </Table>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={draft.id ? "Edit record" : "Add DNS record"}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Select label="Type" value={draft.type} onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as DnsRecordType }))}>
            {RECORD_TYPES.map((t) => (
              <Option key={t} value={t}>
                {t}
              </Option>
            ))}
          </Select>
          <Input label="Host" value={draft.host} onChange={(e) => setDraft((d) => ({ ...d, host: e.target.value }))} placeholder="@" />
          <Input label="Value" value={draft.answer} onChange={(e) => setDraft((d) => ({ ...d, answer: e.target.value }))} placeholder={draft.type === "A" ? "192.0.2.1" : "value"} />
          {needsPriority && (
            <Input
              label="Priority"
              type="number"
              value={draft.priority ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, priority: Number(e.target.value) }))}
            />
          )}
          <Input label="TTL (seconds)" type="number" value={draft.ttl} onChange={(e) => setDraft((d) => ({ ...d, ttl: Number(e.target.value) }))} hint="Minimum 300 seconds" />
          {formError && (
            <Typography variant="caption" sx={{ color: "error.main" }}>
              {formError}
            </Typography>
          )}
          <Button sx={{ mt: 0.5 }} onClick={save} disabled={saving}>
            {saving ? "Saving…" : draft.id ? "Save changes" : "Add record"}
          </Button>
        </Box>
      </Modal>
    </Box>
  );
}
