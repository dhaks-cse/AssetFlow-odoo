"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import type { Role } from "@prisma/client";

import { NAV_ITEMS } from "@/components/shell/nav-items";
import { cn } from "@/lib/utils";

export function SidebarNav({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5 p-2">
      {NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role)).map(
        (item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          if (item.comingSoon) {
            return (
              <span
                key={item.href}
                title="Coming soon"
                className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground/50"
              >
                <Icon className="size-4" />
                {item.label}
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors hover:text-foreground",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-muted"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              ) : null}
              <Icon className="relative z-10 size-4" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        }
      )}
    </nav>
  );
}
