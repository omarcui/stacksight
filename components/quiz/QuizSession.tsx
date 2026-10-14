"use client";

import { useState } from "react";
import { ClipboardList, Clock, Play, Target, Trophy } from "lucide-react";
import { QUIZ_TYPE_LABELS, formatDuration, quizTimeLimit, type QuizAttempt } from "@/lib/quiz";
import { cn } from "@/lib/utils";
import { WEAK_TOPIC_THRESHOLD, useCourseStore, useCourseStoreHydrated } from "@/store/useCourseStore";
import type { ModuleQuiz } from "@/types/quiz";
import { QuizRunner } from "./QuizRunner";
import { QuizSummaryCard } from "./QuizSummaryCard";
import { eyebrowClass, primaryButton } from "./QuizText";

// Intro → runner → summary. Saving the score updates attempts, best score and
// the weak-topic flag (latest score < WEAK_TOPIC_THRESHOLD) in the course store.

type Phase = { kind: "intro" } | { kind: "running"; run: number } | { kind: "done"; run: number; attempt: QuizAttempt };

export function QuizSession({ quiz }: { quiz: ModuleQuiz }) {
  const hydrated = useCourseStoreHydrated();
  const saveQuizScore = useCourseStore((s) => s.saveQuizScore);
  const result = useCourseStore((s) => s.quizScores[quiz.moduleId]);
  const [phase, setPhase] = useState<Phase>({ kind: "intro" });

  function complete(run: number, attempt: QuizAttempt) {
    saveQuizScore(quiz.moduleId, attempt.score);
    setPhase({ kind: "done", run, attempt });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (phase.kind === "running") {
    return <QuizRunner key={phase.run} quiz={quiz} onComplete={(attempt) => complete(phase.run, attempt)} />;
  }

  if (phase.kind === "done") {
    return (
      <QuizSummaryCard
        quiz={quiz}
        attempt={phase.attempt}
        bestScore={result?.bestScore}
        attempts={result?.attempts}
        onRetry={() => setPhase({ kind: "running", run: phase.run + 1 })}
      />
    );
  }

  const typeCounts = Object.entries(
    quiz.questions.reduce<Record<string, number>>((acc, q) => {
      acc[q.type] = (acc[q.type] ?? 0) + 1;
      return acc;
    }, {}),
  );

  const tiles = [
    { label: "Questions", value: String(quiz.questions.length), icon: ClipboardList, tone: "text-stack" },
    { label: "Time limit", value: formatDuration(quizTimeLimit(quiz)), icon: Clock, tone: "text-tracer" },
    { label: "Pass mark", value: `${quiz.passingScore}%`, icon: Target, tone: "text-success" },
    {
      label: "Best score",
      value: result ? `${result.bestScore}%` : "—",
      icon: Trophy,
      tone: "text-heap",
      meta: result ? `${result.attempts} attempt${result.attempts === 1 ? "" : "s"}` : "Not attempted",
      persisted: true,
    },
  ];

  return (
    <section aria-labelledby="quiz-intro" className="rounded-2xl border border-border bg-surface">
      <div className="flex h-11 items-center justify-between gap-3 border-b border-border px-4">
        <h2 id="quiz-intro" className={eyebrowClass}>
          Before you start
        </h2>
        <span className="text-xs text-muted">{quiz.labReference}</span>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <li key={tile.label} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg bg-surface-muted", tile.tone)}>
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  {tile.persisted && !hydrated ? (
                    <span className="block h-5 w-12 animate-pulse rounded bg-surface-muted" />
                  ) : (
                    <span className="block font-mono text-lg font-semibold tabular-nums leading-tight">{tile.value}</span>
                  )}
                  <span className="block text-xs text-muted">
                    {tile.label}
                    {tile.meta && hydrated && ` · ${tile.meta}`}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>

        <div>
          <p className={cn(eyebrowClass, "mb-2")}>Question types</p>
          <ul className="flex flex-wrap gap-2">
            {typeCounts.map(([type, count]) => (
              <li
                key={type}
                className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border bg-surface-muted/40 px-2.5 text-xs font-medium"
              >
                {QUIZ_TYPE_LABELS[type as keyof typeof QUIZ_TYPE_LABELS]}
                <span className="font-mono tabular-nums text-muted">×{count}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm leading-relaxed text-muted">
          Check each answer to see the explanation before moving on. The timer runs for the whole quiz; when it ends,
          unanswered questions count as wrong. A score below {WEAK_TOPIC_THRESHOLD}% flags this module as a weak topic.
        </p>
      </div>

      <div className="flex justify-end border-t border-border px-4 py-3">
        <button
          type="button"
          onClick={() => setPhase({ kind: "running", run: 1 })}
          disabled={!hydrated}
          className={primaryButton}
        >
          <Play className="size-4" aria-hidden />
          {result ? "Retake quiz" : "Start quiz"}
        </button>
      </div>
    </section>
  );
}
