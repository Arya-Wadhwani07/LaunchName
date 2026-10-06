"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { AgentDiscoveryRecord } from "@/lib/agents/types";

/**
 * A lightweight hub-and-spoke diagram — the domain at the center, its
 * published agents arranged around it. Plain SVG, no graph library: this
 * only ever needs to render a handful of nodes for one domain, so a
 * force-directed layout engine would be overkill.
 */
export function AgentNetworkGraph({
  rootDomain,
  agents,
  onSelect,
}: {
  rootDomain: string;
  agents: AgentDiscoveryRecord[];
  onSelect?: (agent: AgentDiscoveryRecord) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const width = 560;
  const height = 320;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - 70;

  const nodes = agents.map((agent, i) => {
    const angle = (i / Math.max(agents.length, 1)) * Math.PI * 2 - Math.PI / 2;
    return { agent, x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={`Agents published under ${rootDomain}`}>
      {nodes.map(({ agent, x, y }) => (
        <line
          key={`line-${agent.id}`}
          x1={cx}
          y1={cy}
          x2={x}
          y2={y}
          stroke={hovered === agent.id ? "#7c5cff" : "#242429"}
          strokeWidth={hovered === agent.id ? 1.5 : 1}
        />
      ))}

      <g>
        <circle cx={cx} cy={cy} r={44} fill="#17171b" stroke="#7c5cff" strokeWidth={1.5} />
        <text x={cx} y={cy - 2} textAnchor="middle" className="fill-ink" style={{ fontSize: 11, fontFamily: "var(--font-mono)" }}>
          {rootDomain.length > 10 ? rootDomain.slice(0, 9) + "…" : rootDomain}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="fill-ink-faint" style={{ fontSize: 9 }}>
          {agents.length} agent{agents.length === 1 ? "" : "s"}
        </text>
      </g>

      {nodes.map(({ agent, x, y }) => (
        <g
          key={agent.id}
          transform={`translate(${x},${y})`}
          className="cursor-pointer"
          onMouseEnter={() => setHovered(agent.id)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onSelect?.(agent)}
        >
          <circle
            r={30}
            fill={agent.status === "verified" ? "#112c26" : "#17171b"}
            stroke={agent.status === "verified" ? "#3ad9b7" : "#242429"}
            strokeWidth={1.5}
            className={cn("transition-all", hovered === agent.id && "drop-shadow-[0_0_8px_rgba(124,92,255,0.4)]")}
          />
          <text textAnchor="middle" y={-2} className="fill-ink" style={{ fontSize: 10, fontWeight: 600 }}>
            {agent.name.length > 12 ? agent.name.slice(0, 10) + "…" : agent.name}
          </text>
          <text textAnchor="middle" y={12} className="fill-ink-faint" style={{ fontSize: 8 }}>
            {agent.publicationPoint}
          </text>
        </g>
      ))}
    </svg>
  );
}
