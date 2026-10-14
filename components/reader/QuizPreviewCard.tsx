"use client";

import Link from "next/link";
import { ArrowRight, ClipboardCheck } from "lucide-react";
import { QUIZ_TYPE_LABELS, getQuizById } from "@/lib/quiz";
import { cn } from "@/lib/utils";
import { useCourseStore, useCourseStoreHydrated } from "@/store/useCourseStore";
import type { ModuleId, QuizPreviewBlock } from "@/types/curriculum";
import { InlineMarkdown } from "./Markdown";

// quiz_preview block: a teaser question, the module quiz status and a link into the quiz (docs/ui-spec.md §3.5).

export function QuizPreviewCard({ block, moduleId }: { block: QuizPreviewBlock; moduleId: ModuleId }) {
  const quiz = getQuizById(moduleId);

  return (
    <aside aria-label="Module quiz preview" className="rounded-xl border border-accent/40 bg-accent/[0.06] p-4">
      <div className="flex items-start gap-3">
        <ClipboardCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
            Check yourself{block.quizType && ` · ${QUIZ_TYPE_LABELS[block.quizType]}`}
          </p>
          <p className="text-sm leading-relaxed">
            <InlineMarkdown text={block.text} />
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-accent/20 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <QuizStatus moduleId={moduleId} passingScore={quiz?.passingScore} questionCount={quiz?.questions.length} />
        <Link
          href={`/quizzes/${moduleId}`}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Start module quiz
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </aside>
  );
}

function QuizStatus({
  moduleId,
  passingScore,
  questionCount,
}: {
  moduleId: ModuleId;
  passingScore?: number;
  questionCount?: number;
}) {
  const hydrated = useCourseStoreHydrated();
  const result = useCourseStore((s) => s.quizScores[moduleId]);

  // Persisted scores only render after hydration, so server and client markup match.
  if (!hydrated) {
    return <span className="h-5 w-40 animate-pulse rounded bg-surface-muted" aria-hidden />;
  }

  const meta = questionCount ? `${questionCount} questions` : null;

  if (!result) {
    return (
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        <span className="inline-flex h-7 items-center rounded-full border border-border bg-surface px-2.5 font-medium">
          Not attempted
        </span>
        {meta && <span className="tabular-nums">{meta}</span>}
        {passingScore !== undefined && <span className="tabular-nums">· pass at {passingScore}%</span>}
      </p>
    );
  }

  const passed = passingScore === undefined || result.bestScore >= passingScore;

  return (
    <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
      <div className="flex items-baseline gap-1.5">
        <dt className="text-muted">Best score</dt>
        <dd className={cn("font-mono text-[13px] font-semibold tabular-nums", passed ? "text-success" : "text-danger")}>
          {result.bestScore}%
        </dd>
      </div>
      <div className="flex items-baseline gap-1.5">
        <dt className="text-muted">Attempts</dt>
        <dd className="font-mono text-[13px] font-semibold tabular-nums">{result.attempts}</dd>
      </div>
      {passingScore !== undefined && (
        <div className="flex items-baseline gap-1.5 text-muted">
          <dt className="sr-only">Passing score</dt>
          <dd className="tabular-nums">pass at {passingScore}%</dd>
        </div>
      )}
    </dl>
  );
}
