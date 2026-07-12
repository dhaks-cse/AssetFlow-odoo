"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { AssetStatus } from "@prisma/client";

import { STATE_GRAPH, legalEvents } from "@/lib/asset-state";
import { cn } from "@/lib/utils";

const SIZE = 340;
const CENTER = SIZE / 2;
const RADIUS = 128;

const NODES: AssetStatus[] = [
  "AVAILABLE",
  "ALLOCATED",
  "RESERVED",
  "UNDER_MAINTENANCE",
  "LOST",
  "RETIRED",
  "DISPOSED",
];

const NODE_LABEL: Record<AssetStatus, string> = {
  AVAILABLE: "Available",
  ALLOCATED: "Allocated",
  RESERVED: "Reserved",
  UNDER_MAINTENANCE: "Under Maintenance",
  LOST: "Lost",
  RETIRED: "Retired",
  DISPOSED: "Disposed",
};

// Same palette as AssetStatusBadge, expressed as fill/ring-friendly values.
const NODE_COLOR: Record<AssetStatus, { bg: string; ring: string; dot: string }> = {
  AVAILABLE: { bg: "bg-emerald-500/10", ring: "ring-emerald-500/40", dot: "bg-emerald-500" },
  ALLOCATED: { bg: "bg-blue-500/10", ring: "ring-blue-500/40", dot: "bg-blue-500" },
  RESERVED: { bg: "bg-amber-500/10", ring: "ring-amber-500/40", dot: "bg-amber-500" },
  UNDER_MAINTENANCE: { bg: "bg-orange-500/10", ring: "ring-orange-500/40", dot: "bg-orange-500" },
  LOST: { bg: "bg-destructive/10", ring: "ring-destructive/40", dot: "bg-destructive" },
  RETIRED: { bg: "bg-muted", ring: "ring-border", dot: "bg-muted-foreground" },
  DISPOSED: { bg: "bg-zinc-500/10", ring: "ring-zinc-500/40", dot: "bg-zinc-500" },
};

function positionOf(index: number) {
  // Start at 12 o'clock, go clockwise.
  const angle = (index / NODES.length) * 2 * Math.PI - Math.PI / 2;
  return {
    x: CENTER + RADIUS * Math.cos(angle),
    y: CENTER + RADIUS * Math.sin(angle),
  };
}

export function StateMachineDiagram({ currentStatus }: { currentStatus: AssetStatus }) {
  const positions = useMemo(
    () => Object.fromEntries(NODES.map((s, i) => [s, positionOf(i)])) as Record<
      AssetStatus,
      { x: number; y: number }
    >,
    []
  );

  const edges = useMemo(() => {
    const list: { from: AssetStatus; to: AssetStatus; event: string }[] = [];
    for (const [event, rule] of Object.entries(STATE_GRAPH)) {
      for (const from of rule.from) {
        list.push({ from, to: rule.to, event });
      }
    }
    return list;
  }, []);

  const legal = new Set(legalEvents(currentStatus).map((e) => STATE_GRAPH[e].to));

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="max-w-full"
        role="img"
        aria-label="Asset lifecycle state machine"
      >
        <defs>
          <marker
            id="arrow-active"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" className="fill-primary" />
          </marker>
          <marker
            id="arrow-dim"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" className="fill-border" />
          </marker>
        </defs>

        {edges.map((edge, i) => {
          const a = positions[edge.from];
          const b = positions[edge.to];
          const isActive = edge.from === currentStatus && legal.has(edge.to);
          // Pull the line short of each node's edge so the arrowhead doesn't
          // hide under the node badge.
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy) || 1;
          const pad = 46;
          const x1 = a.x + (dx / len) * pad;
          const y1 = a.y + (dy / len) * pad;
          const x2 = b.x - (dx / len) * pad;
          const y2 = b.y - (dy / len) * pad;

          return (
            <line
              key={`${edge.event}-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              className={isActive ? "stroke-primary" : "stroke-border"}
              strokeWidth={isActive ? 2 : 1.25}
              strokeDasharray={isActive ? "5 4" : undefined}
              markerEnd={isActive ? "url(#arrow-active)" : "url(#arrow-dim)"}
              opacity={isActive ? 1 : 0.45}
            >
              {isActive ? (
                <animate attributeName="stroke-dashoffset" from="18" to="0" dur="0.7s" repeatCount="indefinite" />
              ) : null}
            </line>
          );
        })}

        {NODES.map((status) => {
          const { x, y } = positions[status];
          const isCurrent = status === currentStatus;
          const color = NODE_COLOR[status];
          return (
            <foreignObject key={status} x={x - 52} y={y - 22} width={104} height={44}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "flex h-11 w-full items-center justify-center rounded-lg px-1.5 text-center text-[11px] font-medium ring-1",
                  color.bg,
                  color.ring,
                  isCurrent && "ring-2 ring-foreground"
                )}
              >
                {isCurrent ? (
                  <motion.span
                    className={cn("mr-1 inline-block size-1.5 rounded-full", color.dot)}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  />
                ) : null}
                {NODE_LABEL[status]}
              </motion.div>
            </foreignObject>
          );
        })}
      </svg>
      <p className="text-center text-xs text-muted-foreground">
        Highlighted arrows are this asset&apos;s legal next transitions, straight from{" "}
        <code className="text-foreground">lib/asset-state.ts</code>.
      </p>
    </div>
  );
}
