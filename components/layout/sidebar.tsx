"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  ChartColumn,
  Check,
  ChevronDown,
  Flame,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  SquareTerminal,
  Star,
  Trophy,
  Zap,
  X,
  type LucideIcon,
} from "lucide-react";
import { openFlashTrace } from "@/components/flash-trace/FlashTraceModal";
import { curriculumData } from "@/data/curriculumData";
import { lessonNumber, moduleNumber } from "@/lib/curriculum-utils";
import { getModuleIcon } from "@/lib/module-icons";
import { cn } from "@/lib/utils";
import {
  useCompletedLessonIds,
  useCourseStore,
  useCourseStoreHydrated,
  useCurrentLesson,
  useWeakModuleIds,
} from "@/store/useCourseStore";
import type { Module } from "@/types/curriculum";
import { Logo } from "./logo";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const PRIMARY_NAV: NavItem[] = [{ href: "/", label: "Dashboard", icon: LayoutDashboard }];

// Anchors into dashboard panels; counts come from the course store.
const QUICK_NAV: NavItem[] = [
  { href: "/#weak-topics", label: "Weak topics", icon: Star },
  { href: "/#bookmarks", label: "Bookmarks", icon: Bookmark },
];

const MODULE_NAV: NavItem[] = curriculumData.map((m) => ({
  href: `/modules/${m.id}`,
  label: m.title,
  icon: getModuleIcon(m.iconName),
}));

const TOOLS_NAV: NavItem[] = [
  { href: "/sandbox", label: "Java Sandbox", icon: SquareTerminal },
  { href: "/progress", label: "Progress", icon: ChartColumn },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const EXPANDED_WIDTH = 280;
const COLLAPSED_WIDTH = 72;

const spring = { type: "spring", stiffness: 380, damping: 36 } as const;

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
};

export function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  return (
    <>
      {/* Desktop: persistent rail that animates between expanded and collapsed widths */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
        transition={spring}
        className="hidden h-full shrink-0 flex-col overflow-hidden border-r border-border bg-surface lg:flex"
        aria-label="Course navigation"
      >
        <SidebarNav variant="desktop" collapsed={collapsed} />

        <AnimatePresence initial={false}>
          {!collapsed && <FlashTraceCard key="flash-trace" />}
        </AnimatePresence>

        <div className="border-t border-border p-3">
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-10 w-full items-center gap-3 rounded-lg px-[15px] text-sm text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {collapsed ? (
              <PanelLeftOpen className="size-[18px] shrink-0" aria-hidden />
            ) : (
              <PanelLeftClose className="size-[18px] shrink-0" aria-hidden />
            )}
            <FadeLabel show={!collapsed}>Collapse</FadeLabel>
          </button>
        </div>
      </motion.aside>

      {/* Mobile: off-canvas drawer with backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onMobileClose}
              className="fixed inset-0 z-40 bg-scrim backdrop-blur-[2px] lg:hidden"
              aria-hidden
            />
            <motion.aside
              key="sidebar-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={spring}
              role="dialog"
              aria-modal="true"
              aria-label="Course navigation"
              className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border bg-surface shadow-2xl lg:hidden"
            >
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
                <Logo onNavigate={onMobileClose} />
                <button
                  type="button"
                  onClick={onMobileClose}
                  aria-label="Close navigation"
                  autoFocus
                  className="grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>
              <SidebarNav
                variant="mobile"
                collapsed={false}
                onNavigate={onMobileClose}
              />
              <FlashTraceCard onLaunch={onMobileClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

type SidebarNavProps = {
  variant: "desktop" | "mobile";
  collapsed: boolean;
  onNavigate?: () => void;
};

/**
 * usePathname suspends during prerendering for dynamic params not covered by
 * generateStaticParams (Cache Components). The fallback renders the same links
 * without active highlighting so the shell stays in the static HTML.
 */
function SidebarNav(props: SidebarNavProps) {
  return (
    <Suspense fallback={<NavList {...props} pathname={null} />}>
      <ActiveNavList {...props} />
    </Suspense>
  );
}

function ActiveNavList(props: SidebarNavProps) {
  const pathname = usePathname();
  return <NavList {...props} pathname={pathname} />;
}

function NavList({
  variant,
  collapsed,
  onNavigate,
  pathname,
}: SidebarNavProps & { pathname: string | null }) {
  const hydrated = useCourseStoreHydrated();
  const weakCount = useWeakModuleIds().length;
  const bookmarkCount = useCourseStore((s) => s.bookmarks.length);
  const badges: Record<string, number | undefined> = hydrated
    ? { "/#weak-topics": weakCount, "/#bookmarks": bookmarkCount }
    : {};

  const sections: { title: string; items: NavItem[]; numbered?: boolean }[] = [
    { title: "Overview", items: PRIMARY_NAV },
    { title: "Quick access", items: QUICK_NAV },
    { title: "Modules", items: MODULE_NAV, numbered: true },
    { title: "Tools", items: TOOLS_NAV },
  ];

  return (
    <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3">
      {sections.map((section, sectionIndex) => (
        <div key={section.title} className={sectionIndex > 0 ? "mt-5" : ""}>
          <div className="mb-1.5 flex h-5 items-center px-[15px]">
            {collapsed ? (
              <span className="h-px w-full bg-border" aria-hidden />
            ) : (
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                {section.title}
              </span>
            )}
          </div>
          <ul className="space-y-0.5">
            {section.items.map((item, i) => {
              const active = pathname !== null && isActivePath(pathname, item.href);
              // The open module expands in place into its unit → lesson outline.
              const outline = section.numbered && active && !collapsed ? curriculumData[i] : undefined;
              return (
                <li key={item.href}>
                  <SidebarLink
                    item={item}
                    badge={badges[item.href]}
                    number={section.numbered ? i + 1 : undefined}
                    active={active}
                    collapsed={collapsed}
                    layoutId={`${variant}-sidebar-active`}
                    onNavigate={onNavigate}
                  />
                  <AnimatePresence initial={false}>
                    {outline && <ModuleOutline key={outline.id} mod={outline} onNavigate={onNavigate} />}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarLink({
  item,
  badge,
  number,
  active,
  collapsed,
  layoutId,
  onNavigate,
}: {
  item: NavItem;
  badge?: number;
  number?: number;
  active: boolean;
  collapsed: boolean;
  layoutId: string;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const label = number ? `Module ${number}: ${item.label}` : item.label;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? label : undefined}
      title={collapsed ? label : undefined}
      className={`group relative flex h-10 items-center gap-3 rounded-lg px-[15px] text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        active
          ? "font-medium text-accent"
          : "text-muted hover:bg-surface-muted hover:text-foreground"
      }`}
    >
      {active && (
        <motion.span
          layoutId={layoutId}
          transition={spring}
          className="absolute inset-0 rounded-lg bg-accent-soft"
          aria-hidden
        >
          <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-accent" />
        </motion.span>
      )}

      <span className="relative shrink-0">
        <Icon className="size-[18px]" aria-hidden />
        {number !== undefined && collapsed && (
          <span className="absolute -bottom-1.5 -right-2 grid size-3.5 place-items-center rounded-full bg-surface text-[9px] font-semibold leading-none ring-1 ring-border">
            {number}
          </span>
        )}
        {!!badge && collapsed && (
          <span className="absolute -right-1.5 -top-1 size-2 rounded-full bg-heap" aria-hidden />
        )}
      </span>

      <FadeLabel show={!collapsed}>
        {number !== undefined && (
          <span className="mr-1.5 font-mono text-xs opacity-60">{moduleNumber(String(number))}</span>
        )}
        {item.label}
      </FadeLabel>

      {!collapsed && badge !== undefined && badge > 0 && (
        <span className="relative ml-auto rounded-full bg-heap/15 px-1.5 text-[11px] font-semibold tabular-nums text-heap">
          {badge}
        </span>
      )}
    </Link>
  );
}

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

/**
 * Unit → lesson tree for the open module (docs/ui-spec.md §3.5). One disclosure per unit;
 * the unit holding the current lesson is always opened. Selecting a lesson makes it the
 * store's active lesson, which the reader renders.
 */
function ModuleOutline({ mod, onNavigate }: { mod: Module; onNavigate?: () => void }) {
  const hydrated = useCourseStoreHydrated();
  const setActiveLesson = useCourseStore((s) => s.setActiveLesson);
  const completed = useCompletedLessonIds(mod.id);
  const current = useCurrentLesson(mod);
  const activeUnitId = current?.unit.id;
  const activeLessonId = current?.lesson.id;

  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set(activeUnitId ? [activeUnitId] : []));

  // Reveal the unit holding the current lesson whenever it changes (e.g. via Prev/Next).
  const [lastActiveUnitId, setLastActiveUnitId] = useState(activeUnitId);
  if (activeUnitId !== lastActiveUnitId) {
    setLastActiveUnitId(activeUnitId);
    if (activeUnitId && !open.has(activeUnitId)) setOpen(new Set(open).add(activeUnitId));
  }

  function toggle(unitId: string) {
    const next = new Set(open);
    if (!next.delete(unitId)) next.add(unitId);
    setOpen(next);
  }

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <ul aria-label={`${mod.title} outline`} className="ml-6 mt-1 space-y-0.5 border-l border-border pb-1 pl-2">
        {mod.units.map((unit, ui) => {
          const isOpen = open.has(unit.id);
          const unitDone = unit.lessons.filter((l) => completed.has(l.id)).length;
          const allDone = hydrated && unitDone === unit.lessons.length;
          const panelId = `sidebar-unit-${unit.id}`;
          return (
            <li key={unit.id}>
              <button
                type="button"
                onClick={() => toggle(unit.id)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className={cn(
                  "flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-surface-muted",
                  focusRing,
                  unit.id === activeUnitId ? "text-foreground" : "text-muted hover:text-foreground",
                )}
              >
                <span className="mt-px font-mono text-[11px] opacity-60">{String(ui + 1).padStart(2, "0")}</span>
                <span className="min-w-0 flex-1 font-medium leading-snug">{unit.title}</span>
                <span className={cn("mt-px text-[11px] tabular-nums", allDone ? "text-success" : "text-muted")}>
                  {hydrated ? `${unitDone}/${unit.lessons.length}` : unit.lessons.length}
                </span>
                <ChevronDown
                  className={cn("mt-0.5 size-3.5 shrink-0 text-muted transition-transform", isOpen && "rotate-180")}
                  aria-hidden
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.ul
                    id={panelId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {unit.lessons.map((lesson, li) => {
                      const active = lesson.id === activeLessonId;
                      const done = completed.has(lesson.id);
                      return (
                        <li key={lesson.id} className="py-px pl-4">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveLesson(mod.id, lesson.id);
                              onNavigate?.();
                            }}
                            disabled={!hydrated}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "relative flex min-h-8 w-full items-center gap-2 rounded-lg px-2.5 py-1 text-left text-[13px] transition-colors disabled:cursor-default",
                              focusRing,
                              active
                                ? "bg-accent-soft font-medium text-accent"
                                : "text-muted hover:bg-surface-muted hover:text-foreground",
                            )}
                          >
                            {active && (
                              <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r bg-accent" aria-hidden />
                            )}
                            <span className="font-mono text-[11px] opacity-70">
                              {lessonNumber({ unitIndex: ui, lessonIndex: li })}
                            </span>
                            <span className="min-w-0 flex-1 leading-snug">{lesson.title}</span>
                            {done && <Check className="size-3.5 shrink-0 text-success" aria-label="completed" />}
                          </button>
                        </li>
                      );
                    })}
                  </motion.ul>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}

function FadeLabel({
  show,
  children,
}: {
  show: boolean;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.span
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0, transition: { delay: 0.08, duration: 0.18 } }}
          exit={{ opacity: 0, x: -6, transition: { duration: 0.1 } }}
          className="relative truncate whitespace-nowrap"
        >
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

/** Flash-Trace 2-minute challenge launcher (docs/ui-spec.md §3.1, §3.7) with the persisted personal bests. */
function FlashTraceCard({ onLaunch }: { onLaunch?: () => void }) {
  const hydrated = useCourseStoreHydrated();
  const highScore = useCourseStore((s) => s.flashTraceHighScore);
  const bestStreak = useCourseStore((s) => s.flashTraceBestStreak);
  const sessions = useCourseStore((s) => s.flashTraceSessionsCount);
  const played = hydrated && sessions > 0;
  // A fixed pattern for the mini "memory grid" motif.
  const cells = "hshhs-shh-hs-ssh-h--shs-".split("");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { delay: 0.1 } }}
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
      className="mx-3 mb-3 shrink-0"
    >
      <button
        type="button"
        onClick={() => {
          onLaunch?.();
          openFlashTrace();
        }}
        aria-label={
          played
            ? `Start Flash-Trace. High score ${highScore}, best streak ${bestStreak}`
            : "Start Flash-Trace 2-minute challenge"
        }
        className={cn(
          "group block w-full rounded-xl border border-border bg-surface-muted/60 p-3 text-left transition-colors hover:border-heap/50 hover:bg-heap/[0.06]",
          focusRing,
        )}
      >
        <span className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold">
            <Zap className="size-3.5 text-heap" aria-hidden />
            Flash-Trace
          </span>
          <span className="grid size-6 place-items-center rounded-full bg-heap text-role-foreground transition-transform group-hover:scale-110">
            <Play className="size-3 fill-current" aria-hidden />
          </span>
        </span>
        <span className="mt-0.5 block text-[11px] text-muted">2-minute logic &amp; memory challenge</span>
        <span className="relative mt-2.5 block" aria-hidden>
          <span className="grid grid-cols-8 gap-1">
            {cells.map((c, i) => (
              <span
                key={i}
                className={cn(
                  "aspect-square rounded-[3px]",
                  c === "h" ? "bg-heap/70" : c === "s" ? "bg-stack/60" : "bg-border",
                )}
              />
            ))}
          </span>
          <span className="absolute inset-0 flex items-center justify-center gap-1.5">
            {played ? (
              <>
                <span className="inline-flex items-center gap-1 rounded-md bg-surface/90 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-heap ring-1 ring-border">
                  <Trophy className="size-3" />
                  {highScore.toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-surface/90 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-success ring-1 ring-border">
                  <Flame className="size-3" />
                  {bestStreak}
                </span>
              </>
            ) : (
              <span className="rounded-md bg-surface/90 px-1.5 py-0.5 text-[11px] font-semibold text-foreground ring-1 ring-border">
                {hydrated ? "Set a high score" : "\u00a0"}
              </span>
            )}
          </span>
        </span>
      </button>
    </motion.div>
  );
}
