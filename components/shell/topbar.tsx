"use client";

import { useTransition } from "react";
import { MenuIcon, LogOutIcon } from "lucide-react";
import type { Role } from "@prisma/client";

import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { RoleBadge } from "@/components/shell/role-badge";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { ThemeToggle } from "@/components/theme-toggle";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Topbar({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: Role;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="md:hidden">
                <MenuIcon className="size-4" />
                <span className="sr-only">Open navigation</span>
              </Button>
            }
          />
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="border-b">
              <SheetTitle>AssetFlow</SheetTitle>
            </SheetHeader>
            <SidebarNav role={role} />
          </SheetContent>
        </Sheet>
        <span className="font-heading text-sm font-semibold md:hidden">AssetFlow</span>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex items-center gap-2 rounded-lg py-1 pr-1 pl-1.5 hover:bg-muted">
                <div className="hidden flex-col items-end sm:flex">
                  <span className="text-sm font-medium leading-tight">{name}</span>
                  <RoleBadge role={role} className="h-4 px-1.5 text-[10px]" />
                </div>
                <Avatar size="sm">
                  <AvatarFallback>{initials(name)}</AvatarFallback>
                </Avatar>
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
              <span className="text-sm font-medium text-foreground">{name}</span>
              <span className="text-xs text-muted-foreground">{email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={isPending}
              onClick={() => startTransition(() => logoutAction())}
            >
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
