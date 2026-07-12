"use client";

import { motion } from "framer-motion";

/**
 * Next.js remounts template.tsx on every navigation (unlike layout.tsx),
 * so this replays the fade-in on each route change without re-fetching
 * the shell (sidebar/topbar) itself.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
}
