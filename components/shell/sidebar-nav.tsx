"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
                "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
                isActive ? "bg-muted text-foreground" : "text-muted-foreground"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        }
      )}
    </nav>
  );
}
