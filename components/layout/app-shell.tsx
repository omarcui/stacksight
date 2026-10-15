"use client";

import { useEffect, useState } from "react";
import { MotionConfig } from "framer-motion";
import { FlashTraceModal } from "@/components/flash-trace/FlashTraceModal";
import { hydrateCourseStore } from "@/store/useCourseStore";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Load persisted course progress after mount (the store skips automatic hydration).
  useEffect(() => hydrateCourseStore(), []);

  // While the mobile drawer is open: close on Escape or when resizing to desktop.
  useEffect(() => {
    if (!mobileOpen) return;

    const close = () => setMobileOpen(false);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onBreakpoint = (e: MediaQueryListEvent) => {
      if (e.matches) close();
    };

    window.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onBreakpoint);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onBreakpoint);
    };
  }, [mobileOpen]);

  return (
    <MotionConfig reducedMotion="user">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:text-accent-foreground"
      >
        Skip to content
      </a>

      {/* The viewport never scrolls: only <main> (and the sidebar nav) scroll inside this fixed frame. */}
      <div className="flex h-dvh w-full flex-col overflow-hidden">
        <Navbar onOpenMobileNav={() => setMobileOpen(true)} />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <Sidebar
            collapsed={collapsed}
            onToggleCollapsed={() => setCollapsed((c) => !c)}
            mobileOpen={mobileOpen}
            onMobileClose={() => setMobileOpen(false)}
          />

          <main
            id="main-content"
            tabIndex={-1}
            className="relative h-full min-w-0 flex-1 overflow-y-auto overscroll-contain focus:outline-none"
          >
            {children}
          </main>
        </div>
      </div>

      <FlashTraceModal />
    </MotionConfig>
  );
}
