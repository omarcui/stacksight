"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  ChartColumn,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  SquareTerminal,
  Star,
  Zap,
  X,
  type LucideIcon,
} from "lucide-react";
import { curriculumData } from "@/data/curriculumData";
import { moduleNumber } from "@/lib/curriculum-utils";
import { getModuleIcon } from "@/lib/module-icons";
import { cn } from "@/lib/utils";
import {
  useCourseStore,
  useCourseStoreHydrated,
  useWeakModuleIds,
} from "@/store/useCourseStore";
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

const EXPANDED_WIDTH = 256;
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
        className="hidden shrink-0 flex-col overflow-hidden border-r border-border bg-surface lg:flex"
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
              <FlashTraceCard />
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
    <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3">
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
            {section.items.map((item, i) => (
              <li key={item.href}>
                <SidebarLink
                  item={item}
                  badge={badges[item.href]}
                  number={section.numbered ? i + 1 : undefined}
                  active={pathname !== null && isActivePath(pathname, item.href)}
                  collapsed={collapsed}
                  layoutId={`${variant}-sidebar-active`}
                  onNavigate={onNavigate}
                />
              </li>
            ))}
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

/** Flash-Trace 2-minute challenge teaser (docs/ui-spec.md §3.1). The game itself is not built yet. */
function FlashTraceCard() {
  // A fixed pattern for the mini "memory grid" motif.
  const cells = "hshhs-shh-hs-ssh-h--shs-".split("");
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { delay: 0.1 } }}
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
      className="mx-3 mb-3 shrink-0 rounded-xl border border-border bg-surface-muted/60 p-3"
    >
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold">
          <Zap className="size-3.5 text-heap" aria-hidden />
          Flash-Trace
        </p>
        <span className="rounded-full border border-border px-1.5 text-[10px] font-medium text-muted">
          Soon
        </span>
      </div>
      <p className="mt-0.5 text-[11px] text-muted">2-minute pointer challenge</p>
      <div className="mt-2.5 grid grid-cols-8 gap-1" aria-hidden>
        {cells.map((c, i) => (
          <span
            key={i}
            className={cn(
              "aspect-square rounded-[3px]",
              c === "h" ? "bg-heap/70" : c === "s" ? "bg-stack/60" : "bg-border",
            )}
          />
        ))}
      </div>
    </motion.div>
  );
}
