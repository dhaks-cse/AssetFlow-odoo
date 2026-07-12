"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CountUp } from "@/components/motion/count-up";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import type { DashboardKpis } from "@/lib/queries/dashboard";

const POLL_MS = 10_000;

const LABELS: { key: keyof DashboardKpis; label: string }[] = [
  { key: "available", label: "Assets Available" },
  { key: "allocated", label: "Assets Allocated" },
  { key: "underMaintenance", label: "Under Maintenance" },
  { key: "activeBookings", label: "Active Bookings" },
  { key: "pendingTransfers", label: "Pending Transfers" },
  { key: "upcomingReturns", label: "Upcoming Returns" },
];

export function LiveKpis({ initial }: { initial: DashboardKpis }) {
  const [kpis, setKpis] = useState(initial);
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/dashboard/kpis", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const next = (await res.json()) as DashboardKpis;
        setKpis(next);
        setPulsing(true);
        setTimeout(() => setPulsing(false), 700);
      } catch {
        // Network hiccup — just wait for the next tick.
      }
    }, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="relative flex size-1.5">
          <span
            className={`absolute inline-flex h-full w-full rounded-full bg-emerald-500 ${
              pulsing ? "animate-ping" : ""
            }`}
          />
          <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
        </span>
        Live
      </div>
      <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {LABELS.map(({ key, label }) => (
          <StaggerItem key={key}>
            <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
              <Card size="sm">
                <CardHeader>
                  <CardTitle className="text-xs font-normal text-muted-foreground">
                    {label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold tabular-nums">
                  <CountUp value={kpis[key]} />
                </CardContent>
              </Card>
            </motion.div>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
