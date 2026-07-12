import type { NextAuthConfig } from "next-auth";

const PUBLIC_PATHS = ["/login", "/signup"];

/**
 * Lightweight config (no Prisma/bcrypt) shared by proxy.ts and auth.ts.
 * Proxy only needs the `authorized` callback for the optimistic route gate —
 * the real credential check lives in auth.ts's Credentials provider.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublicPath = PUBLIC_PATHS.includes(nextUrl.pathname);

      if (isPublicPath) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
