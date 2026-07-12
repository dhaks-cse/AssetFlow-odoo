import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";

// Lightweight auth() built from the edge-safe config — used only for the
// optimistic "are you logged in" gate. No Prisma/bcrypt in this bundle.
//
// Exported directly (not wrapped in `auth(callback)`) because the
// `authorized` callback in auth.config.ts only runs for the direct-export
// form — wrapping bypasses it and every route falls through unguarded.
const { auth } = NextAuth(authConfig);

export { auth as proxy };

export const config = {
  // Everything except static assets and the NextAuth API routes goes through
  // the `authorized` callback in auth.config.ts.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
