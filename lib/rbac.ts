import type { Role } from "@prisma/client";

import { auth } from "@/auth";

/**
 * Guard for server actions. Proxy only does an optimistic logged-in check,
 * so every role-sensitive action must re-verify here.
 */
export async function requireRole(...roles: Role[]) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized: sign in required");
  }

  if (!roles.includes(session.user.role)) {
    throw new Error("Forbidden: insufficient role");
  }

  return session;
}
