import type { Role } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboardIcon,
  BoxesIcon,
  ArrowRightLeftIcon,
  CalendarClockIcon,
  WrenchIcon,
  ClipboardCheckIcon,
  BarChart3Icon,
  BellIcon,
  Building2Icon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Only these roles see the item. Omit to show it to everyone. */
  roles?: Role[];
  /** Not built yet — rendered disabled instead of linking out. */
  comingSoon?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboardIcon },
  { label: "Assets", href: "/assets", icon: BoxesIcon },
  { label: "Allocations", href: "/allocations", icon: ArrowRightLeftIcon, comingSoon: true },
  { label: "Bookings", href: "/bookings", icon: CalendarClockIcon, comingSoon: true },
  { label: "Maintenance", href: "/maintenance", icon: WrenchIcon, comingSoon: true },
  { label: "Audits", href: "/audits", icon: ClipboardCheckIcon, comingSoon: true },
  { label: "Reports", href: "/reports", icon: BarChart3Icon, comingSoon: true },
  { label: "Activity & Notifications", href: "/activity", icon: BellIcon, comingSoon: true },
  {
    label: "Org Setup",
    href: "/org-setup",
    icon: Building2Icon,
    roles: ["ADMIN"],
    comingSoon: true,
  },
];
