import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getDashboardKpis } from "@/lib/queries/dashboard";

/** Polled client-side by LiveKpis for a lightweight "real-time" dashboard feel. */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const kpis = await getDashboardKpis();
  return NextResponse.json(kpis);
}
