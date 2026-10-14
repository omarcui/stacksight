"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Module } from "@/types/curriculum";

const paneHeaderClass = "flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border px-4";
const eyebrowClass = "text-[11px] font-semibold uppercase tracking-wider text-muted";
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

/** Module outline: one disclosure per unit, listing its lessons. The active lesson's unit stays open. */
export function UnitAccordion({
  mod,
  activeUnitId,
  activeLessonId,
  completed,
  ready,
  onSelect,
}: {
  mod: Module;
  activeUnitId: string;
  activeLessonId: string;
  /** Completed lesson IDs; empty until the store has hydrated. */
  completed: ReadonlySet<string>;
  /** False until the store has hydrated; selection is disabled before that. */
  ready: boolean;
  onSelect: (lessonId: string) => void;
}) {
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set([activeUnitId]));
  const [mobileOpen, setMobileOpen] = useState(false);

  // Reveal the unit holding the active lesson whenever it changes (e.g. via Prev/Next).
  const [lastActiveUnitId, setLastActiveUnitId] = useState(activeUnitId);
  if (activeUnitId !== lastActiveUnitId) {
    setLastActiveUnitId(activeUnitId);
    if (!open.has(activeUnitId)) setOpen(new Set(open).add(activeUnitId));
  }

  function toggle(unitId: string) {
    const next = new Set(open);
    if (!next.delete(unitId)) next.add(unitId);
    setOpen(next);
  }

  const totalLessons = mod.units.reduce((sum, u) => sum + u.lessons.length, 0);
  const doneLessons = mod.units.reduce((sum, u) => sum + u.lessons.filter((l) => completed.has(l.id)).length, 0);

  return (
    <aside aria-label="Module outline" className="flex min-h-0 flex-col rounded-2xl border border-border bg-surface">
      <div className={paneHeaderClass}>
        <span className={eyebrowClass}>Units</span>
        <div className="flex items-center gap-2">
          <span className="text-xs tabular-nums text-muted">
            {ready ? `${doneLessons}/${totalLessons} done` : `${totalLessons} lessons`}
          </span>
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-controls="unit-accordion-body"
            aria-label={mobileOpen ? "Hide outline" : "Show outline"}
            className={cn(
              "grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-muted hover:text-foreground lg:hidden",
              focusRing,
            )}
          >
            <ChevronDown className={cn("size-4 transition-transform", mobileOpen && "rotate-180")} aria-hidden />
          </button>
        </div>
      </div>

      <div
        id="unit-accordion-body"
        className={cn("min-h-0 flex-1 overflow-y-auto p-2 lg:block", mobileOpen ? "block" : "hidden")}
      >
        <ul className="space-y-1">
          {mod.units.map((unit, ui) => {
            const isOpen = open.has(unit.id);
            const unitDone = unit.lessons.filter((l) => completed.has(l.id)).length;
            const panelId = `unit-${unit.id}-lessons`;
            return (
              <li key={unit.id}>
                <button
                  type="button"
                  onClick={() => toggle(unit.id)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-surface-muted",
                    focusRing,
                  )}
                >
                  <span className="mt-0.5 font-mono text-[11px] text-muted">{String(ui + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold leading-snug">{unit.title}</span>
                    <span className="block truncate text-xs text-muted">{unit.slideReference}</span>
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 text-xs tabular-nums",
                      ready && unitDone === unit.lessons.length ? "text-success" : "text-muted",
                    )}
                  >
                    {ready ? `${unitDone}/${unit.lessons.length}` : unit.lessons.length}
                  </span>
                  <ChevronDown
                    className={cn("mt-0.5 size-4 shrink-0 text-muted transition-transform", isOpen && "rotate-180")}
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
                          <li key={lesson.id} className="py-0.5 pl-6">
                            <button
                              type="button"
                              onClick={() => {
                                onSelect(lesson.id);
                                setMobileOpen(false);
                              }}
                              disabled={!ready}
                              aria-current={active ? "page" : undefined}
                              className={cn(
                                "relative flex min-h-9 w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-left text-sm transition-colors disabled:cursor-default",
                                focusRing,
                                active
                                  ? "bg-accent/10 font-medium text-foreground"
                                  : "text-muted hover:bg-surface-muted hover:text-foreground",
                              )}
                            >
                              {active && (
                                <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r bg-accent" aria-hidden />
                              )}
                              <span className="font-mono text-[11px] opacity-70">
                                {ui + 1}.{li + 1}
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
      </div>
    </aside>
  );
}
