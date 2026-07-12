"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AssetStatus } from "@prisma/client";

import type { AssetUtilizationRow } from "@/lib/queries/reports";

const STATUS_LABEL: Record<AssetStatus, string> = {
  AVAILABLE: "Available",
  ALLOCATED: "Allocated",
  RESERVED: "Reserved",
  UNDER_MAINTENANCE: "Under Maint.",
  LOST: "Lost",
  RETIRED: "Retired",
  DISPOSED: "Disposed",
};

export function AssetUtilizationChart({ data }: { data: AssetUtilizationRow[] }) {
  const chartData = data.map((row) => ({ label: STATUS_LABEL[row.status], count: row.count }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={50} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--popover)",
            borderColor: "var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="count" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
