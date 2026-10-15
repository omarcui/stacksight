"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bookmark,
  BookOpenCheck,
  Check,
  ClipboardCheck,
  Layers,
  Star,
  Target,
  Zap,
} from "lucide-react";
import { curriculumData, curriculumPhases } from "@/data/curriculumData";
import { findModuleLesson, getModuleById, lessonNumber, moduleNumber } from "@/lib/curriculum-utils";
import { cn } from "@/lib/utils";
import {
  WEAK_TOPIC_THRESHOLD,
  isWeakQuizResult,
  useCourseStats,
  useCourseStore,
  useCourseStoreHydrated,
  useWeakModuleIds,
  type ModuleStats,
} from "@/store/useCourseStore";
import type { Module } from "@/types/curriculum";

const cardClass = "rounded-xl border border-border bg-surface p-4";
const eyebrowClass = "text-[11px] font-semibold uppercase tracking-wider text-muted";

// ---------------------------------------------------------------------------
// Stat tiles
// ---------------------------------------------------------------------------

export function StatsOverview() {
  const hydrated = useCourseStoreHydrated();
  const stats = useCourseStats();
  const quizScores = useCourseStore((s) => s.quizScores);

  const quizValues = Object.values(quizScores);
  const avgQuiz = quizValues.length
    ? Math.round(quizValues.reduce((sum, q) => sum + q.score, 0) / quizValues.length)
    : null;

  const tiles = [
    { label: "Course complete", value: `${stats.percent}%`, icon: Target, tone: "text-tracer" },
    { label: "Lessons done", value: `${stats.completedLessons}/${stats.totalLessons}`, icon: BookOpenCheck, tone: "text-stack" },
    { label: "Modules done", value: `${stats.completedModules}/${curriculumData.length}`, icon: Layers, tone: "text-success" },
    { label: "Avg. quiz score", value: avgQuiz === null ? "—" : `${avgQuiz}%`, icon: ClipboardCheck, tone: "text-heap" },
  ];

  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <li key={tile.label} className={cn(cardClass, "flex items-center gap-3")}>
            <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg bg-surface-muted", tile.tone)}>
              <Icon className="size-4" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs text-muted">{tile.label}</span>
              {hydrated ? (
                <motion.span
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="block text-xl font-semibold tabular-nums"
                >
                  {tile.value}
                </motion.span>
              ) : (
                <span className="mt-1 block h-6 w-12 animate-pulse rounded bg-surface-muted" />
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Phase-grouped syllabus roadmap
// ---------------------------------------------------------------------------

type ModuleStatus = "completed" | "in-progress" | "not-started";

export function PhaseRoadmap() {
  const hydrated = useCourseStoreHydrated();
  const stats = useCourseStats();
  const activeModuleId = useCourseStore((s) => s.activeModuleId);
  const weak = new Set(useWeakModuleIds());
  const byId = new Map<string, ModuleStats>(stats.modules.map((m) => [m.moduleId, m]));

  function statusOf(mod: Module): ModuleStatus {
    const s = byId.get(mod.id);
    if (!hydrated || !s) return "not-started";
    if (s.totalLessons > 0 && s.percent === 100) return "completed";
    if (s.completedLessons > 0 || activeModuleId === mod.id) return "in-progress";
    return "not-started";
  }

  return (
    <div className="space-y-6">
      {curriculumPhases.map((phase) => {
        const modules = curriculumData.filter((m) => phase.moduleIds.includes(m.id));
        const done = modules.filter((m) => statusOf(m) === "completed").length;
        return (
          <section key={phase.id} aria-labelledby={`phase-${phase.id}`}>
            <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-border pb-2">
              <h2 id={`phase-${phase.id}`} className="text-base font-semibold">
                Phase {phase.id}: <span className="text-muted">{phase.title}</span>
              </h2>
              <span className="text-xs tabular-nums text-muted">
                {hydrated ? `${done}/${modules.length} complete` : "—"}
              </span>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {modules.map((mod) => (
                <li key={mod.id}>
                  <ModuleCard
                    mod={mod}
                    stats={byId.get(mod.id)}
                    status={statusOf(mod)}
                    weak={hydrated && weak.has(mod.id)}
                    hydrated={hydrated}
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

const statusStyles: Record<ModuleStatus, { card: string; label: string; bar: string }> = {
  completed: { card: "border-success/40 bg-success/[0.06]", label: "text-success", bar: "bg-success" },
  "in-progress": { card: "border-heap/50 bg-heap/[0.06] glow-heap", label: "text-heap", bar: "bg-heap" },
  "not-started": { card: "border-border bg-surface hover:border-border-strong", label: "text-muted", bar: "bg-stack" },
};

function ModuleCard({
  mod,
  stats,
  status,
  weak,
  hydrated,
}: {
  mod: Module;
  stats?: ModuleStats;
  status: ModuleStatus;
  weak: boolean;
  hydrated: boolean;
}) {
  const style = statusStyles[status];
  const percent = hydrated ? (stats?.percent ?? 0) : 0;
  const statusLabel =
    status === "completed"
      ? "Completed"
      : status === "in-progress"
        ? "In progress"
        : hydrated && stats
          ? `${stats.totalLessons} lessons`
          : " ";

  return (
    <Link
      href={`/modules/${mod.id}`}
      className={cn(
        "group flex h-full min-h-40 flex-col rounded-xl border p-4 transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        style.card,
      )}
    >
      <span className="flex items-center justify-between">
        <span className="font-mono text-xs text-muted">{moduleNumber(mod.id)} |</span>
        <span className="flex items-center gap-1.5">
          {weak && (
            <Star
              className="size-3.5 fill-heap text-heap"
              aria-label="Weak topic"
            />
          )}
          {status === "completed" && <Check className="size-4 text-success" aria-hidden />}
        </span>
      </span>
      <span className="mt-1 text-sm font-semibold leading-snug">{mod.title}</span>
      <span className={cn("text-xs", style.label)}>{statusLabel}</span>

      <span className="mt-auto flex items-center gap-3 pt-4">
        <Bar value={percent} className="flex-1" barClass={style.bar} label={`Module ${moduleNumber(mod.id)} completion`} />
        <span className="w-9 text-right text-xs tabular-nums text-muted">{hydrated ? `${percent}%` : "—"}</span>
      </span>

      {status === "in-progress" && (
        <span className="mt-3 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-heap text-xs font-semibold text-role-foreground transition-opacity group-hover:opacity-90">
          Resume module
          <ArrowRight className="size-3.5" aria-hidden />
        </span>
      )}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Weak topics & bookmarks
// ---------------------------------------------------------------------------

export function WeakTopics() {
  const hydrated = useCourseStoreHydrated();
  const weakIds = useWeakModuleIds();
  const quizScores = useCourseStore((s) => s.quizScores);
  const flashTraceFlags = useCourseStore((s) => s.weakTopics);

  return (
    <section id="weak-topics" aria-labelledby="weak-heading" className={cn(cardClass, "h-full scroll-mt-20")}>
      <h2 id="weak-heading" className={cn(eyebrowClass, "flex items-center gap-1.5")}>
        <Star className="size-3.5 fill-heap text-heap" aria-hidden />
        Weak topics
      </h2>
      {!hydrated ? (
        <ListSkeleton />
      ) : weakIds.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          Nothing flagged. Modules with a latest quiz score below {WEAK_TOPIC_THRESHOLD}% or a missed Flash-Trace
          question show up here.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {weakIds.map((id) => (
            <li key={id}>
              <Link
                href={`/modules/${id}`}
                className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-muted"
              >
                <span className="font-mono text-xs text-muted">{moduleNumber(id)}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{getModuleById(curriculumData, id)?.title}</span>
                {flashTraceFlags.includes(id) && <FlashTracePill />}
                {isWeakQuizResult(quizScores[id]) && <ScorePill score={quizScores[id]?.score ?? 0} />}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function BookmarkedLessons() {
  const hydrated = useCourseStoreHydrated();
  const bookmarks = useCourseStore((s) => s.bookmarks);
  const setActiveLesson = useCourseStore((s) => s.setActiveLesson);

  return (
    <section id="bookmarks" aria-labelledby="bookmarks-heading" className={cn(cardClass, "h-full scroll-mt-20")}>
      <h2 id="bookmarks-heading" className={cn(eyebrowClass, "flex items-center gap-1.5")}>
        <Bookmark className="size-3.5 text-stack" aria-hidden />
        Bookmarks
      </h2>
      {!hydrated ? (
        <ListSkeleton />
      ) : bookmarks.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Bookmark a lesson in the reader to pin it here.</p>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {bookmarks.map(({ moduleId, lessonId }) => {
            const loc = findModuleLesson(curriculumData, moduleId, lessonId);
            if (!loc) return null;
            return (
              <li key={lessonId}>
                <Link
                  href={`/modules/${moduleId}`}
                  onClick={() => setActiveLesson(moduleId, lessonId)}
                  className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-muted"
                >
                  <span className="font-mono text-xs text-muted">
                    {moduleNumber(moduleId)} | {lessonNumber(loc)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{loc.lesson.title}</span>
                  <ArrowRight className="size-3.5 text-muted" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Recent quiz scores
// ---------------------------------------------------------------------------

const dateFormat = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function RecentQuizScores({ limit = 5 }: { limit?: number }) {
  const hydrated = useCourseStoreHydrated();
  const quizScores = useCourseStore((s) => s.quizScores);

  const recent = Object.entries(quizScores)
    .map(([moduleId, result]) => ({ moduleId, ...result }))
    .sort((a, b) => b.takenAt - a.takenAt)
    .slice(0, limit);

  return (
    <section aria-labelledby="quiz-heading" className={cn(cardClass, "h-full")}>
      <h2 id="quiz-heading" className={cn(eyebrowClass, "flex items-center gap-1.5")}>
        <ClipboardCheck className="size-3.5 text-tracer" aria-hidden />
        Recent quiz scores
      </h2>

      {!hydrated ? (
        <ListSkeleton />
      ) : recent.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No quizzes taken yet. Finish a module and test yourself.</p>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {recent.map((quiz, i) => (
            <motion.li
              key={quiz.moduleId}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/quizzes/${quiz.moduleId}`}
                className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-muted"
              >
                <ScorePill score={quiz.score} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {getModuleById(curriculumData, quiz.moduleId)?.title ?? "Unknown module"}
                  </span>
                  <span className="block text-xs text-muted">
                    Best {quiz.bestScore}% · {quiz.attempts} attempt{quiz.attempts === 1 ? "" : "s"} ·{" "}
                    {dateFormat.format(quiz.takenAt)}
                  </span>
                </span>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------

export function ScorePill({ score }: { score: number }) {
  const tone =
    score >= 80
      ? "bg-success/15 text-success"
      : score >= WEAK_TOPIC_THRESHOLD
        ? "bg-heap/15 text-heap"
        : "bg-danger/15 text-danger";
  return (
    <span className={cn("grid h-7 w-12 shrink-0 place-items-center rounded-md text-xs font-semibold tabular-nums", tone)}>
      {score}%
    </span>
  );
}

/** Marks a weak topic flagged by missed Flash-Trace questions. */
export function FlashTracePill() {
  return (
    <span
      title="Missed in Flash-Trace"
      className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md bg-heap/15 px-2 text-xs font-semibold text-heap"
    >
      <Zap className="size-3.5" aria-hidden />
      <span className="sr-only">Missed in</span> Trace
    </span>
  );
}

export function ListSkeleton() {
  return (
    <div className="mt-3 space-y-2" aria-busy="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-8 animate-pulse rounded bg-surface-muted" />
      ))}
    </div>
  );
}

export function Bar({
  value,
  label,
  className = "",
  barClass = "bg-accent",
}: {
  value: number;
  label: string;
  className?: string;
  barClass?: string;
}) {
  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className={cn("relative block h-1.5 overflow-hidden rounded-full bg-surface-muted", className)}
    >
      <motion.span
        className={cn("absolute inset-y-0 left-0 rounded-full", barClass)}
        initial={false}
        animate={{ width: `${value}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      />
    </span>
  );
}
