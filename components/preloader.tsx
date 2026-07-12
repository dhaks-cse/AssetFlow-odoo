"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BoxesIcon } from "lucide-react";

const MIN_DISPLAY_MS = 1100;

export function Preloader({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), MIN_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence>
        {visible ? (
          <motion.div
            key="preloader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 z-100 flex flex-col items-center justify-center gap-6 overflow-hidden bg-zinc-950"
          >
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              style={{
                backgroundImage:
                  "radial-gradient(circle at 50% 40%, color-mix(in oklch, var(--primary) 25%, transparent), transparent 60%)",
              }}
            />
            <motion.div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.07 }}
              transition={{ duration: 1 }}
            />

            <motion.div
              className="relative flex items-center gap-3"
              initial={{ opacity: 0, scale: 0.85, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                className="flex size-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15"
                animate={{ rotate: [0, 6, -6, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <BoxesIcon className="size-5 text-white" />
              </motion.div>
              <span className="font-heading text-2xl font-semibold tracking-tight text-white">
                AssetFlow
              </span>
            </motion.div>

            <motion.div
              className="relative h-0.5 w-40 overflow-hidden rounded-full bg-white/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <motion.div
                className="h-full w-1/3 rounded-full bg-white/80"
                animate={{ x: ["-100%", "220%"] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: visible ? 0 : 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="flex flex-1 flex-col"
      >
        {children}
      </motion.div>
    </>
  );
}
