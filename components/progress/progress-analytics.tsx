"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, ClipboardCheck, History, Layers, RotateCcw, Star } from "lucide-react";
import { curriculumData } from "@/data/curriculumData";
import { quizData } from "@/data/quizData";
import { findLesson, flattenLessons, getModuleById, lessonNumber, moduleNumber } from "@/lib/curriculum-utils";
import { getModuleIcon } from "@/lib/module-icons";
import { cn } from "@/lib/utils";
import { Bar, FlashTracePill, ListSkeleton, ScorePill } from "@/components/dashboard/dashboard-widgets";
import {
  WEAK_TOPIC_THRESHOLD,
  isWeakQuizResult,
  useCourseStats,
  useCourseStore,
  useCourseStoreHydrated,
  useWeakModuleIds,
  type QuizResult,
} from "@/store/useCourseStore";
import type { ModuleId } from "@/types/curriculum";

const paneClass = "rounded-2xl border border-border bg-surface";
const paneHeaderClass = "flex h-11 items-center justify-between gap-3 border-b border-border px-4";
const eyebrowClass = "text-[11px] font-semibold uppercase tracking-wider text-muted";

const average = (values: number[]) =>
  values.length ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length) : null;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function ProgressAnalytics() {
  return (
    <div className="space-y-6">
      <CourseSummary />
      <div className="grid gap-3 lg:grid-cols-2">
        <ModuleCompletion />
        <QuizAverages />
      </div>
      <WeakTopicReview />
      <CompletionTimeline />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overall summary
// ---------------------------------------------------------------------------

function CourseSummary() {
  const hydrated = useCourseStoreHydrated();
  const stats = useCourseStats();

  return (
    <section aria-labelledby="summary-heading" className={cn(paneClass, "p-5")}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="summary-heading" className={eyebrowClass}>
          Course completion
        </h2>
        <span className="text-xs tabular-nums text-muted">
          {hydrated
            ? `${stats.completedLessons}/${stats.totalLessons} lessons · ${stats.completedModules}/${curriculumData.length} modules`
            : "—"}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-4">
        {hydrated ? (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-20 text-3xl font-semibold tabular-nums text-tracer"
          >
            {stats.percent}%
          </motion.span>
        ) : (
          <span className="h-9 w-20 animate-pulse rounded bg-surface-muted" />
        )}
        <Bar
          value={hydrated ? stats.percent : 0}
          label="Course completion"
          className="h-2.5 flex-1"
          barClass="bg-tracer"
        />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Per-module completion
// ---------------------------------------------------------------------------

function ModuleCompletion() {
  const hydrated = useCourseStoreHydrated();
  const stats = useCourseStats();

  return (
    <section aria-labelledby="modules-heading" className={paneClass}>
      <div className={paneHeaderClass}>
        <h2 id="modules-heading" className={cn(eyebrowClass, "flex items-center gap-1.5")}>
          <Layers className="size-3.5 text-stack" aria-hidden />
          Completion by module
        </h2>
      </div>
      {!hydrated ? (
        <div className="p-4">
          <ListSkeleton />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {stats.modules.map((m) => {
            const mod = getModuleById(curriculumData, m.moduleId);
            if (!mod) return null;
            const Icon = getModuleIcon(mod.iconName);
            const done = m.totalLessons > 0 && m.percent === 100;
            return (
              <li key={m.moduleId}>
                <Link
                  href={`/modules/${m.moduleId}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                >
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-lg bg-surface-muted",
                      done ? "text-success" : m.completedLessons > 0 ? "text-heap" : "text-muted",
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted">{moduleNumber(m.moduleId)} |</span>
                      <span className="truncate text-sm font-semibold leading-snug">{mod.title}</span>
                      {done && <Check className="size-3.5 shrink-0 text-success" aria-hidden />}
                    </span>
                    <span className="mt-1.5 flex items-center gap-3">
                      <Bar
                        value={m.percent}
                        label={`Module ${moduleNumber(m.moduleId)} completion`}
                        className="flex-1"
                        barClass={done ? "bg-success" : m.completedLessons > 0 ? "bg-heap" : "bg-stack"}
                      />
                      <span className="w-20 text-right text-xs tabular-nums text-muted">
                        {m.completedLessons}/{m.totalLessons} · {m.percent}%
                      </span>
                    </span>
                  </span>
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
// Quiz score averages
// ---------------------------------------------------------------------------

function QuizAverages() {
  const hydrated = useCourseStoreHydrated();
  const quizScores = useCourseStore((s) => s.quizScores);

  const taken = quizData
    .map((quiz) => ({ quiz, result: quizScores[quiz.moduleId] }))
    .filter((q): q is { quiz: (typeof quizData)[number]; result: QuizResult } => q.result !== undefined);

  const latestAvg = average(taken.map((q) => q.result.score));
  const bestAvg = average(taken.map((q) => q.result.bestScore));
  const attempts = taken.reduce((sum, q) => sum + q.result.attempts, 0);
  const passed = taken.filter((q) => q.result.bestScore >= q.quiz.passingScore).length;

  const tiles = [
    { label: "Avg. latest", value: latestAvg === null ? "—" : `${latestAvg}%` },
    { label: "Avg. best", value: bestAvg === null ? "—" : `${bestAvg}%` },
    { label: "Passed", value: `${passed}/${quizData.length}` },
    { label: "Attempts", value: `${attempts}` },
  ];

  return (
    <section aria-labelledby="quiz-avg-heading" className={paneClass}>
      <div className={paneHeaderClass}>
        <h2 id="quiz-avg-heading" className={cn(eyebrowClass, "flex items-center gap-1.5")}>
          <ClipboardCheck className="size-3.5 text-tracer" aria-hidden />
          Quiz scores
        </h2>
        <span className="flex items-center gap-3 text-[11px] text-muted">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-tracer" aria-hidden /> Latest
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-stack/40" aria-hidden /> Best
          </span>
        </span>
      </div>

      {!hydrated ? (
        <div className="p-4">
          <ListSkeleton />
        </div>
      ) : (
        <div className="p-4">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tiles.map((tile) => (
              <li key={tile.label} className="rounded-lg bg-surface-muted px-3 py-2">
                <span className="block text-xs text-muted">{tile.label}</span>
                <span className="block text-lg font-semibold tabular-nums">{tile.value}</span>
              </li>
            ))}
          </ul>

          {taken.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No quizzes taken yet. Finish a module and test yourself.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {quizData.map((quiz) => {
                const result = quizScores[quiz.moduleId];
                return (
                  <li key={quiz.id}>
                    <Link
                      href={`/quizzes/${quiz.id}`}
                      className="-mx-2 block rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <span className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-muted">{moduleNumber(quiz.moduleId)}</span>
                        <span className="min-w-0 flex-1 truncate font-medium">{quiz.title}</span>
                        <span className="tabular-nums text-muted">
                          {result ? `${result.score}% · best ${result.bestScore}%` : "Not taken"}
                        </span>
                      </span>
                      <ScoreTrack result={result} passingScore={quiz.passingScore} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

/** Best score as a faint fill, latest score on top, with a tick at the pass mark. */
function ScoreTrack({ result, passingScore }: { result?: QuizResult; passingScore: number }) {
  const latest = result?.score ?? 0;
  const latestTone =
    latest < WEAK_TOPIC_THRESHOLD ? "bg-danger" : latest >= passingScore ? "bg-tracer" : "bg-heap";

  return (
    <span
      role="img"
      aria-label={result ? `Latest ${result.score}%, best ${result.bestScore}%, pass mark ${passingScore}%` : "Not taken"}
      className="relative mt-1.5 block h-2 overflow-hidden rounded-full bg-surface-muted"
    >
      <motion.span
        className="absolute inset-y-0 left-0 rounded-full bg-stack/40"
        initial={false}
        animate={{ width: `${result?.bestScore ?? 0}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      />
      <motion.span
        className={cn("absolute inset-y-0 left-0 rounded-full", latestTone)}
        initial={false}
        animate={{ width: `${latest}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      />
      <span className="absolute inset-y-0 w-px bg-foreground/50" style={{ left: `${passingScore}%` }} aria-hidden />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Weak topic review cards
// ---------------------------------------------------------------------------

function WeakTopicReview() {
  const hydrated = useCourseStoreHydrated();
  const weakIds = useWeakModuleIds();

  return (
    <section aria-labelledby="weak-review-heading">
      <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-border pb-2">
        <h2 id="weak-review-heading" className="flex items-center gap-1.5 text-base font-semibold">
          <Star className="size-4 fill-heap text-heap" aria-hidden />
          Weak topics to review
        </h2>
        <span className="text-xs tabular-nums text-muted">
          {hydrated ? `${weakIds.length} flagged · quiz below ${WEAK_TOPIC_THRESHOLD}% or Flash-Trace miss` : "—"}
        </span>
      </div>

      {!hydrated ? (
        <ListSkeleton />
      ) : weakIds.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
          Nothing flagged. Modules with a latest quiz score below {WEAK_TOPIC_THRESHOLD}% or a missed Flash-Trace
          question show up here with a review plan.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {weakIds.map((id) => (
            <li key={id}>
              <WeakTopicCard moduleId={id} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function WeakTopicCard({ moduleId }: { moduleId: ModuleId }) {
  const mod = getModuleById(curriculumData, moduleId);
  const result = useCourseStore((s) => s.quizScores[moduleId]);
  const flashTraceFlag = useCourseStore((s) => s.weakTopics.includes(moduleId));
  const completed = useCourseStore((s) => s.progress[moduleId]?.completedLessons);
  const setActiveLesson = useCourseStore((s) => s.setActiveLesson);
  if (!mod) return null;
  const weakQuiz = isWeakQuizResult(result);

  const done = new Set(completed ?? []);
  // Unfinished lessons first: they are the most likely gaps behind the low score.
  const lessons = flattenLessons(curriculumData)
    .filter((loc) => loc.module.id === moduleId)
    .sort((a, b) => Number(done.has(a.lesson.id)) - Number(done.has(b.lesson.id)))
    .slice(0, 3);

  return (
    <article className="flex h-full flex-col rounded-xl border border-heap/50 bg-heap/[0.06] p-4">
      <header className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="font-mono text-xs text-muted">{moduleNumber(moduleId)} |</span>
          <h3 className="text-sm font-semibold leading-snug">{mod.title}</h3>
        </span>
        <span className="flex shrink-0 gap-1.5">
          {flashTraceFlag && <FlashTracePill />}
          {result && weakQuiz && <ScorePill score={result.score} />}
        </span>
      </header>
      <p className="mt-1 text-xs tabular-nums text-muted">
        {result
          ? `Best ${result.bestScore}% · ${result.attempts} attempt${result.attempts === 1 ? "" : "s"}`
          : "Quiz not attempted"}
        {flashTraceFlag && " · missed in Flash-Trace"}
      </p>

      <p className={cn(eyebrowClass, "mt-4")}>Review these lessons</p>
      <ul className="mt-1">
        {lessons.map((loc) => (
          <li key={loc.lesson.id}>
            <Link
              href={`/modules/${moduleId}`}
              onClick={() => setActiveLesson(moduleId, loc.lesson.id)}
              className="-mx-2 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="font-mono text-xs text-muted">{lessonNumber(loc)}</span>
              <span className="min-w-0 flex-1 truncate">{loc.lesson.title}</span>
              {done.has(loc.lesson.id) ? (
                <Check className="size-3.5 text-success" aria-label="Completed" />
              ) : (
                <ArrowRight className="size-3.5 text-muted" aria-hidden />
              )}
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-4">
        <Link
          href={`/quizzes/${moduleId}`}
          className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-heap text-xs font-semibold text-role-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <RotateCcw className="size-3.5" aria-hidden />
          {result ? "Retake quiz" : "Take quiz"}
        </Link>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Lesson completion timeline
// ---------------------------------------------------------------------------

const dayFormat = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" });
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

type TimelineEntry = { lessonId: string; at: number | null };

function CompletionTimeline() {
  const hydrated = useCourseStoreHydrated();
  const progress = useCourseStore((s) => s.progress);
  const completedAt = useCourseStore((s) => s.lessonCompletedAt);

  const entries: TimelineEntry[] = Object.values(progress)
    .flatMap((p) => p?.completedLessons ?? [])
    .filter((id) => findLesson(curriculumData, id))
    .map((lessonId) => ({ lessonId, at: completedAt[lessonId] ?? null }))
    .sort((a, b) => (b.at ?? 0) - (a.at ?? 0));

  // Group by calendar day; lessons completed before timestamps were recorded go last.
  const groups: { label: string; entries: TimelineEntry[] }[] = [];
  for (const entry of entries) {
    const label = entry.at === null ? "Earlier" : dayFormat.format(entry.at);
    const last = groups.at(-1);
    if (last?.label === label) last.entries.push(entry);
    else groups.push({ label, entries: [entry] });
  }

  return (
    <section aria-labelledby="timeline-heading" className={paneClass}>
      <div className={paneHeaderClass}>
        <h2 id="timeline-heading" className={cn(eyebrowClass, "flex items-center gap-1.5")}>
          <History className="size-3.5 text-success" aria-hidden />
          Lesson completion timeline
        </h2>
        <span className="text-xs tabular-nums text-muted">{hydrated ? `${entries.length} completed` : "—"}</span>
      </div>

      <div className="p-4">
        {!hydrated ? (
          <ListSkeleton />
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted">Completed lessons appear here, newest first.</p>
        ) : (
          <ol className="space-y-5">
            {groups.map((group) => (
              <li key={group.label}>
                <p className={eyebrowClass}>{group.label}</p>
                <ol className="mt-2 border-l border-border">
                  {group.entries.map(({ lessonId, at }, i) => {
                    const loc = findLesson(curriculumData, lessonId)!;
                    return (
                      <motion.li
                        key={lessonId}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(i, 8) * 0.04 }}
                        className="relative py-1.5 pl-5"
                      >
                        <span
                          className="absolute -left-[5px] top-1/2 size-2.5 -translate-y-1/2 rounded-full border-2 border-surface bg-success"
                          aria-hidden
                        />
                        <span className="flex items-center gap-3">
                          <span className="font-mono text-xs text-muted">
                            {moduleNumber(loc.module.id)} | {lessonNumber(loc)}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">{loc.lesson.title}</span>
                          <span className="text-xs tabular-nums text-muted">
                            {at === null ? "—" : timeFormat.format(at)}
                          </span>
                        </span>
                      </motion.li>
                    );
                  })}
                </ol>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
