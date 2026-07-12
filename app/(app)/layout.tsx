import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { Topbar } from "@/components/shell/topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Proxy already gates this route group; this is the defense-in-depth check
  // for direct server-side renders (e.g. RSC prefetch) that bypass it.
  if (!session?.user) {
    redirect("/login");
  }

  const { name, email, role } = session.user;

  return (
    <div className="flex flex-1">
      <aside className="hidden w-56 shrink-0 flex-col border-r md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <span className="font-heading text-sm font-semibold">AssetFlow</span>
        </div>
        <SidebarNav role={role} />
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar name={name ?? email ?? "User"} email={email ?? ""} role={role} />
        <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
