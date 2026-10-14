"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

// Skip the enter animation on the initial load so server-rendered content is visible
// before hydration; animate only on client-side navigations (template remounts per route).
let hasHydrated = false;

export default function Template({ children }: { children: React.ReactNode }) {
  const [skipEnter] = useState(() => !hasHydrated);

  useEffect(() => {
    hasHydrated = true;
  }, []);

  return (
    <motion.div
      initial={skipEnter ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
