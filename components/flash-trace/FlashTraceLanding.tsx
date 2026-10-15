"use client";

import { useEffect } from "react";
import { Flame, Hash, Play, Trophy } from "lucide-react";
import { flashTraceData } from "@/data/flashTraceData";
import { cn } from "@/lib/utils";
import { useCourseStore, useCourseStoreHydrated } from "@/store/useCourseStore";
import { openFlashTrace } from "./FlashTraceModal";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

/** Body of /flash-trace: personal bests plus a relaunch button. Opens the modal on arrival. */
export function FlashTraceLanding() {
  const hydrated = useCourseStoreHydrated();
  const highScore = useCourseStore((s) => s.flashTraceHighScore);
  const bestStreak = useCourseStore((s) => s.flashTraceBestStreak);
  const sessions = useCourseStore((s) => s.flashTraceSessionsCount);

  useEffect(() => openFlashTrace(), []);

  const stats = [
    { label: "High score", value: highScore.toLocaleString(), icon: Trophy, tone: "text-heap" },
    { label: "Best streak", value: bestStreak, icon: Flame, tone: "text-success" },
    { label: "Sessions", value: sessions, icon: Hash, tone: "text-stack" },
  ];

  return (
    <div className="space-y-6">
      <dl className="grid gap-3 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-4">
            <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
              <Icon className={cn("size-3.5", tone)} aria-hidden />
              {label}
            </dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">
              {hydrated ? value : <span className="inline-block h-7 w-16 animate-pulse rounded bg-surface-muted" />}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col items-start gap-3 rounded-2xl border border-heap/40 bg-heap/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground/85">
          {flashTraceData.length} snippets across all six modules. Misses flag their module on your dashboard&apos;s weak
          topics.
        </p>
        <button
          type="button"
          onClick={openFlashTrace}
          className={cn(
            "inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-heap px-3 text-sm font-semibold text-role-foreground transition-opacity hover:opacity-90",
            focusRing,
          )}
        >
          <Play className="size-4 fill-current" aria-hidden />
          Launch challenge
        </button>
      </div>
    </div>
  );
}
