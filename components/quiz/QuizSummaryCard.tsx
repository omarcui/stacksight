"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BadgeCheck, BookOpen, Check, Clock, LayoutDashboard, RotateCcw, Star, Trophy, X, XCircle } from "lucide-react";
import { curriculumData } from "@/data/curriculumData";
import { findLesson, lessonNumber } from "@/lib/curriculum-utils";
import { describeAnswer, describeCorrectAnswer, formatDuration, type QuizAttempt } from "@/lib/quiz";
import { cn } from "@/lib/utils";
import { WEAK_TOPIC_THRESHOLD, useCourseStore } from "@/store/useCourseStore";
import type { ModuleQuiz } from "@/types/quiz";
import { QuizText, eyebrowClass, focusRing, ghostButton, primaryButton, secondaryButton } from "./QuizText";

// Results: score ring, passing badge, weak-topic notice and a per-question breakdown.

const RING_RADIUS = 52;

export function QuizSummaryCard({
  quiz,
  attempt,
  bestScore,
  attempts,
  onRetry,
}: {
  quiz: ModuleQuiz;
  attempt: QuizAttempt;
  /** From the course store, including this attempt. */
  bestScore?: number;
  attempts?: number;
  onRetry: () => void;
}) {
  const passed = attempt.score >= quiz.passingScore;
  const weak = attempt.score < WEAK_TOPIC_THRESHOLD;
  const tone = passed ? "text-success" : "text-danger";

  return (
    <section aria-labelledby="quiz-results" className="rounded-2xl border border-border bg-surface">
      <div className="flex h-11 items-center justify-between gap-3 border-b border-border px-4">
        <h2 id="quiz-results" className={eyebrowClass}>
          Results
        </h2>
        <PassBadge passed={passed} />
      </div>

      <div className="grid gap-5 p-4 sm:p-5 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-8">
        <ScoreRing score={attempt.score} passingScore={quiz.passingScore} className={tone} />

        <div className="space-y-4">
          <div>
            <p className="text-base font-semibold">
              {passed ? "Nice work — module quiz passed." : `You need ${quiz.passingScore}% to pass.`}
            </p>
            <p className="mt-1 text-sm text-muted">
              {attempt.correctCount} of {attempt.total} correct
              {attempt.timedOut && " · time ran out, unanswered questions count as wrong"}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={Check} label="Correct" value={`${attempt.correctCount}/${attempt.total}`} tone="text-success" />
            <Stat icon={Clock} label="Time" value={formatDuration(attempt.elapsedSeconds)} tone="text-tracer" />
            <Stat icon={Trophy} label="Best" value={bestScore === undefined ? "—" : `${bestScore}%`} tone="text-stack" />
            <Stat icon={RotateCcw} label="Attempts" value={attempts === undefined ? "—" : String(attempts)} tone="text-muted" />
          </dl>

          {weak && (
            <p className="flex items-start gap-2 rounded-xl border border-heap/40 bg-heap/[0.06] p-3 text-sm">
              <Star className="mt-0.5 size-4 shrink-0 fill-current text-heap" aria-hidden />
              <span>
                <span className="font-semibold text-heap">Flagged as a weak topic.</span>{" "}
                Scores under {WEAK_TOPIC_THRESHOLD}% add this module to your weak topics. Review the lessons below and
                retake the quiz to clear it.
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-border px-4 py-4 sm:px-5">
        <h3 className={cn(eyebrowClass, "mb-2")}>Breakdown</h3>
        <ol className="divide-y divide-border">
          {quiz.questions.map((question, i) => {
            const outcome = attempt.outcomes.find((o) => o.questionId === question.id);
            return (
              <BreakdownRow
                key={question.id}
                n={i + 1}
                prompt={question.prompt}
                correct={outcome?.correct ?? false}
                yourAnswer={describeAnswer(question, outcome?.answer ?? null)}
                correctAnswer={describeCorrectAnswer(question)}
                lessonId={question.lessonId}
              />
            );
          })}
        </ol>
      </div>

      <div className="flex flex-col gap-2 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-end">
        <Link href="/" className={cn(ghostButton, "sm:mr-auto")}>
          <LayoutDashboard className="size-4" aria-hidden />
          Dashboard
        </Link>
        <Link href={`/modules/${quiz.moduleId}`} className={secondaryButton}>
          <BookOpen className="size-4" aria-hidden />
          Review module
        </Link>
        <button type="button" onClick={onRetry} className={primaryButton}>
          <RotateCcw className="size-4" aria-hidden />
          Retry quiz
        </button>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

function PassBadge({ passed }: { passed: boolean }) {
  return passed ? (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 text-xs font-medium text-success glow-success">
      <BadgeCheck className="size-3.5" aria-hidden />
      Passed
    </span>
  ) : (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-danger/30 bg-danger/10 px-2.5 text-xs font-medium text-danger">
      <XCircle className="size-3.5" aria-hidden />
      Not passed
    </span>
  );
}

function ScoreRing({ score, passingScore, className }: { score: number; passingScore: number; className?: string }) {
  const circumference = 2 * Math.PI * RING_RADIUS;
  // Tick on the track marking the pass mark, measured clockwise from 12 o'clock.
  const angle = (passingScore / 100) * 2 * Math.PI - Math.PI / 2;
  const tick = { x: 60 + RING_RADIUS * Math.cos(angle), y: 60 + RING_RADIUS * Math.sin(angle) };

  return (
    <div className={cn("relative mx-auto size-36 shrink-0", className)}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={RING_RADIUS} fill="none" strokeWidth="8" className="stroke-surface-muted" />
        <motion.circle
          cx="60"
          cy="60"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - score / 100) }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <svg viewBox="0 0 120 120" className="absolute inset-0 size-full" aria-hidden>
        <circle cx={tick.x} cy={tick.y} r="3" className="fill-foreground" />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <span className="font-mono text-3xl font-semibold tabular-nums">{score}%</span>
        <span className="text-[11px] text-muted">pass {passingScore}%</span>
      </div>
      <span className="sr-only">
        Score {score} percent; pass mark {passingScore} percent.
      </span>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Check;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-muted/40 px-3 py-2">
      <dt className="flex items-center gap-1.5 text-xs text-muted">
        <Icon className={cn("size-3.5", tone)} aria-hidden />
        {label}
      </dt>
      <dd className="mt-0.5 font-mono text-base font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function BreakdownRow({
  n,
  prompt,
  correct,
  yourAnswer,
  correctAnswer,
  lessonId,
}: {
  n: number;
  prompt: string;
  correct: boolean;
  yourAnswer: string;
  correctAnswer: string;
  lessonId?: string;
}) {
  const setActiveLesson = useCourseStore((s) => s.setActiveLesson);
  const lesson = !correct && lessonId ? findLesson(curriculumData, lessonId) : undefined;

  return (
    <li className="flex gap-3 py-3">
      <span className="w-6 shrink-0 pt-0.5 font-mono text-[13px] tabular-nums text-muted">{String(n).padStart(2, "0")}</span>
      <span
        className={cn(
          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full",
          correct ? "bg-success/15 text-success" : "bg-danger/15 text-danger",
        )}
      >
        {correct ? <Check className="size-3" aria-hidden /> : <X className="size-3" aria-hidden />}
        <span className="sr-only">{correct ? "Correct" : "Incorrect"}</span>
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="line-clamp-2 text-sm leading-snug">
          <QuizText text={prompt} />
        </p>
        {!correct && (
          <dl className="grid gap-x-2 text-xs sm:grid-cols-[auto_minmax(0,1fr)]">
            <dt className="text-muted">Your answer</dt>
            <dd className="break-words font-mono text-danger">{yourAnswer}</dd>
            <dt className="text-muted">Correct</dt>
            <dd className="break-words font-mono text-success">{correctAnswer}</dd>
          </dl>
        )}
        {lesson && (
          <Link
            href={`/modules/${lesson.module.id}`}
            onClick={() => setActiveLesson(lesson.module.id, lesson.lesson.id)}
            className={cn("inline-flex items-center gap-1 rounded-md text-xs font-medium text-accent hover:underline", focusRing)}
          >
            <BookOpen className="size-3" aria-hidden />
            Review <span className="font-mono">{lessonNumber(lesson)}</span> {lesson.lesson.title}
          </Link>
        )}
      </div>
    </li>
  );
}
