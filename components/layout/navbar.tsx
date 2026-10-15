"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Menu } from "lucide-react";
import { curriculumData } from "@/data/curriculumData";
import { getModuleById, moduleNumber } from "@/lib/curriculum-utils";
import { Logo } from "./logo";
import { HeaderStats } from "./header-stats";
import { ThemeToggle } from "./theme-toggle";

type Crumb = { label: string; href?: string };

function getBreadcrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  const home: Crumb = { label: "Dashboard", href: "/" };

  if (segments.length === 0) return [{ label: "Dashboard" }];

  const [section, id] = segments;
  const mod = id ? getModuleById(curriculumData, decodeURIComponent(id)) : undefined;
  switch (section) {
    case "modules":
      return [
        home,
        { label: "Modules" },
        { label: mod ? `${moduleNumber(mod.id)}. ${mod.title}` : "Module not found" },
      ];
    case "quizzes":
      return [
        home,
        { label: "Quizzes" },
        { label: mod ? `Quiz: ${mod.title}` : "Quiz not found" },
      ];
    case "sandbox":
      return [home, { label: "Java Sandbox" }];
    case "progress":
      return [home, { label: "Progress" }];
    case "flash-trace":
      return [home, { label: "Flash-Trace" }];
    default:
      return [home, { label: decodeURIComponent(section) }];
  }
}

export function Navbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface/80 px-3 backdrop-blur-md supports-[backdrop-filter]:bg-surface/70 sm:px-4">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        className="grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <Logo />

      <span className="hidden h-5 w-px bg-border md:block" aria-hidden />

      <div className="min-w-0 flex-1">
        {/* usePathname may suspend on unknown dynamic params; keep the header in the static shell. */}
        <Suspense fallback={null}>
          <Breadcrumbs />
        </Suspense>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <HeaderStats />
        <ThemeToggle />
      </div>
    </header>
  );
}

function Breadcrumbs() {
  const pathname = usePathname();
  const crumbs = getBreadcrumbs(pathname);

  return (
    <nav aria-label="Breadcrumb" className="hidden md:block">
      <AnimatePresence mode="wait" initial={false}>
        <motion.ol
          key={pathname}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.15 }}
          className="flex min-w-0 items-center gap-1 text-sm"
        >
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <li
                key={`${crumb.label}-${i}`}
                className={`flex items-center gap-1 ${isLast ? "min-w-0" : "shrink-0"}`}
              >
                {i > 0 && (
                  <ChevronRight
                    className="size-3.5 shrink-0 text-muted/60"
                    aria-hidden
                  />
                )}
                <span className={isLast ? "truncate" : undefined}>
                  {isLast ? (
                    <span aria-current="page" className="font-medium text-foreground">
                      {crumb.label}
                    </span>
                  ) : crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="text-muted transition-colors hover:text-foreground"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-muted">{crumb.label}</span>
                  )}
                </span>
              </li>
            );
          })}
        </motion.ol>
      </AnimatePresence>
    </nav>
  );
}
