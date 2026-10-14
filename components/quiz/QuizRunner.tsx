"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpen, Check, CheckCircle2, Clock, Flag, Lightbulb, X, XCircle } from "lucide-react";
import { curriculumData } from "@/data/curriculumData";
import { findLesson, lessonNumber } from "@/lib/curriculum-utils";
import {
  QUIZ_TYPE_LABELS,
  formatDuration,
  gradeAttempt,
  isAnswerComplete,
  isAnswerCorrect,
  quizTimeLimit,
  type QuizAnswer,
  type QuizAttempt,
} from "@/lib/quiz";
import { cn } from "@/lib/utils";
import { useCourseStore } from "@/store/useCourseStore";
import type { ModuleQuiz, OptionQuestion, QuizDifficulty, QuizQuestion } from "@/types/quiz";
import { CodeFillQuestion } from "./CodeFillQuestion";
import { ConsoleOutput, QuizCode, QuizText, eyebrowClass, focusRing, ghostButton, primaryButton } from "./QuizText";

// Step-by-step quiz: one question at a time, check → feedback → next, under a
// whole-quiz countdown. Grading is local; the caller persists the attempt.

const TICK_MS = 250;
const LETTERS = "ABCDEFGH";

const DIFFICULTY_TONE: Record<QuizDifficulty, string> = {
  easy: "border-success/30 bg-success/10 text-success",
  medium: "border-heap/30 bg-heap/10 text-heap",
  hard: "border-danger/30 bg-danger/10 text-danger",
};

export function QuizRunner({ quiz, onComplete }: { quiz: ModuleQuiz; onComplete: (attempt: QuizAttempt) => void }) {
  const timeLimit = quizTimeLimit(quiz);
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuizAnswer>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const finished = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const question = quiz.questions[index];
  const total = quiz.questions.length;
  const answer = answers[question.id] ?? null;
  const isChecked = checked[question.id] === true;
  const isCorrect = isChecked && isAnswerCorrect(question, answer);
  const isLast = index === total - 1;

  const elapsed = Math.floor((now - startedAt) / 1000);
  const remaining = Math.max(0, timeLimit - elapsed);
  const correctSoFar = quiz.questions.filter((q) => checked[q.id] && isAnswerCorrect(q, answers[q.id] ?? null)).length;
  const checkedCount = Object.keys(checked).length;

  function finish(timedOut: boolean) {
    if (finished.current) return;
    finished.current = true;
    const seconds = Math.min(timeLimit, Math.round((Date.now() - startedAt) / 1000));
    onComplete(gradeAttempt(quiz, answers, seconds, timedOut));
  }

  // Unanswered and unchecked questions count as wrong when time runs out.
  const onTick = useEffectEvent(() => {
    const t = Date.now();
    setNow(t);
    if (t - startedAt >= timeLimit * 1000) finish(true);
  });

  useEffect(() => {
    const id = window.setInterval(onTick, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  // Move focus to the new question so keyboard and screen-reader users follow along.
  useEffect(() => {
    if (index > 0) headingRef.current?.focus();
  }, [index]);

  function setAnswer(next: QuizAnswer) {
    if (isChecked) return;
    setAnswers((prev) => ({ ...prev, [question.id]: next }));
  }

  function check() {
    if (isChecked || !isAnswerComplete(question, answer)) return;
    setChecked((prev) => ({ ...prev, [question.id]: true }));
  }

  function advance() {
    if (isLast) finish(false);
    else setIndex((i) => i + 1);
  }

  return (
    <section aria-labelledby="quiz-question" className="rounded-2xl border border-border bg-surface">
      {/* Header: step counter, score tracker, timer */}
      <div className="flex h-11 items-center justify-between gap-3 border-b border-border px-4">
        <p className={eyebrowClass}>
          Question{" "}
          <span className="font-mono text-[13px] normal-case tracking-normal text-foreground">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="font-mono text-[13px] normal-case tracking-normal"> / {String(total).padStart(2, "0")}</span>
        </p>
        <div className="flex items-center gap-2">
          <ScoreTracker correct={correctSoFar} wrong={checkedCount - correctSoFar} />
          <QuizTimer remaining={remaining} />
        </div>
      </div>

      <StepBar quiz={quiz} index={index} answers={answers} checked={checked} />

      <AnimatePresence mode="wait" initial={false}>
        <motion.form
          key={question.id}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.2 }}
          onSubmit={(e) => {
            e.preventDefault();
            if (isChecked) advance();
            else check();
          }}
        >
          <div className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("inline-flex h-6 items-center rounded-full border px-2 text-[11px] font-medium capitalize", DIFFICULTY_TONE[question.difficulty])}>
                {question.difficulty}
              </span>
              <span className="text-xs text-muted">{QUIZ_TYPE_LABELS[question.type]}</span>
            </div>

            <h2
              id="quiz-question"
              ref={headingRef}
              tabIndex={-1}
              className="text-base font-medium leading-relaxed focus:outline-none sm:text-[17px]"
            >
              <QuizText text={question.prompt} />
            </h2>

            {question.type === "code_fill" ? (
              <CodeFillQuestion
                question={question}
                values={answer?.kind === "fill" ? answer.values : {}}
                onChange={(blankId, value) =>
                  setAnswer({
                    kind: "fill",
                    values: { ...(answer?.kind === "fill" ? answer.values : {}), [blankId]: value },
                  })
                }
                checked={isChecked}
                onSubmit={() => (isChecked ? advance() : check())}
              />
            ) : (
              <>
                {question.code && (
                  <QuizCode
                    code={question.code}
                    language={question.language}
                    errorLine={question.type === "syntax_fix" ? question.errorLine : undefined}
                  />
                )}
                <OptionSelector
                  question={question}
                  selectedId={answer?.kind === "choice" ? answer.optionId : null}
                  checked={isChecked}
                  onSelect={(optionId) => setAnswer({ kind: "choice", optionId })}
                />
              </>
            )}

            <div aria-live="polite">
              {isChecked && <Feedback question={question} answer={answer} correct={isCorrect} />}
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex flex-col-reverse gap-2 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => finish(false)}
              className={cn(ghostButton, "self-start")}
            >
              <Flag className="size-4" aria-hidden />
              Finish now
            </button>
            {isChecked ? (
              <button type="submit" className={primaryButton}>
                {isLast ? "See results" : "Next question"}
                <ArrowRight className="size-4" aria-hidden />
              </button>
            ) : (
              <button type="submit" disabled={!isAnswerComplete(question, answer)} className={primaryButton}>
                <Check className="size-4" aria-hidden />
                Check answer
              </button>
            )}
          </div>
        </motion.form>
      </AnimatePresence>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Header widgets
// ---------------------------------------------------------------------------

function ScoreTracker({ correct, wrong }: { correct: number; wrong: number }) {
  return (
    <p className="flex items-center gap-2 font-mono text-xs tabular-nums" aria-label={`${correct} correct, ${wrong} wrong`}>
      <span className="inline-flex items-center gap-1 text-success">
        <Check className="size-3.5" aria-hidden />
        {correct}
      </span>
      <span className="inline-flex items-center gap-1 text-danger">
        <X className="size-3.5" aria-hidden />
        {wrong}
      </span>
    </p>
  );
}

function QuizTimer({ remaining }: { remaining: number }) {
  const tone =
    remaining <= 15
      ? "border-danger/40 bg-danger/10 text-danger"
      : remaining <= 60
        ? "border-heap/40 bg-heap/10 text-heap"
        : "border-border bg-surface-muted text-muted";
  return (
    <span
      role="timer"
      aria-label={`Time remaining ${formatDuration(remaining)}`}
      className={cn("inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 font-mono text-xs tabular-nums transition-colors", tone)}
    >
      <Clock className="size-3.5" aria-hidden />
      {formatDuration(remaining)}
    </span>
  );
}

function StepBar({
  quiz,
  index,
  answers,
  checked,
}: {
  quiz: ModuleQuiz;
  index: number;
  answers: Record<string, QuizAnswer>;
  checked: Record<string, boolean>;
}) {
  return (
    <ol className="flex gap-1 px-4 pt-3" aria-label="Quiz progress">
      {quiz.questions.map((q, i) => {
        const done = checked[q.id];
        const correct = done && isAnswerCorrect(q, answers[q.id] ?? null);
        const status = done ? (correct ? "correct" : "wrong") : i === index ? "current" : "upcoming";
        return (
          <li
            key={q.id}
            aria-label={`Question ${i + 1}: ${status}`}
            aria-current={i === index ? "step" : undefined}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              status === "correct" && "bg-success",
              status === "wrong" && "bg-danger",
              status === "current" && "bg-accent",
              status === "upcoming" && "bg-surface-muted",
            )}
          />
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Option selector: native radios for arrow-key navigation, styled as cards.
// ---------------------------------------------------------------------------

function OptionSelector({
  question,
  selectedId,
  checked,
  onSelect,
}: {
  question: OptionQuestion;
  selectedId: string | null;
  checked: boolean;
  onSelect: (optionId: string) => void;
}) {
  return (
    <fieldset>
      <legend className="sr-only">Choose one answer</legend>
      <div className="grid gap-2">
        {question.options.map((option, i) => {
          const selected = option.id === selectedId;
          const isAnswer = option.id === question.correctOptionId;
          const state = !checked
            ? selected
              ? "selected"
              : "idle"
            : isAnswer
              ? "correct"
              : selected
                ? "wrong"
                : "dimmed";

          return (
            <label
              key={option.id}
              className={cn(
                "relative flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                "has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-accent",
                state === "idle" && "border-border bg-surface hover:bg-surface-muted",
                state === "selected" && "border-accent/60 bg-accent/10",
                state === "correct" && "border-success/40 bg-success/[0.06]",
                state === "wrong" && "animate-shake border-danger/50 bg-danger/[0.06]",
                state === "dimmed" && "border-border opacity-60",
                checked && "cursor-default",
              )}
            >
              <input
                type="radio"
                name={question.id}
                value={option.id}
                checked={selected}
                onChange={() => onSelect(option.id)}
                disabled={checked}
                className="sr-only"
              />
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-md border font-mono text-[11px] font-semibold",
                  state === "idle" && "border-border-strong text-muted",
                  state === "selected" && "border-accent bg-accent text-accent-foreground",
                  state === "correct" && "border-success bg-success text-role-foreground",
                  state === "wrong" && "border-danger bg-danger text-role-foreground",
                  state === "dimmed" && "border-border text-muted",
                )}
                aria-hidden
              >
                {state === "correct" ? (
                  <Check className="size-3.5" />
                ) : state === "wrong" ? (
                  <X className="size-3.5" />
                ) : (
                  LETTERS[i]
                )}
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1 break-words",
                  option.isCode ? "font-mono text-[13px] leading-6" : "text-sm leading-relaxed",
                  state === "correct" && "text-success",
                  state === "wrong" && "text-danger",
                )}
              >
                {option.isCode ? option.text : <QuizText text={option.text} />}
              </span>
              {checked && (state === "correct" || state === "wrong") && (
                <span className="sr-only">{state === "correct" ? "(correct answer)" : "(your answer, incorrect)"}</span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

// ---------------------------------------------------------------------------
// Feedback after checking
// ---------------------------------------------------------------------------

function Feedback({
  question,
  answer,
  correct,
}: {
  question: QuizQuestion;
  answer: QuizAnswer | null;
  correct: boolean;
}) {
  const setActiveLesson = useCourseStore((s) => s.setActiveLesson);
  const { explanation } = question;
  const picked =
    question.type !== "code_fill" && answer?.kind === "choice"
      ? question.options.find((o) => o.id === answer.optionId)
      : undefined;
  const lesson = !correct && question.lessonId ? findLesson(curriculumData, question.lessonId) : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("space-y-3 rounded-xl border p-4", correct ? "border-success/40 bg-success/[0.06]" : "border-danger/40 bg-danger/[0.06]")}
    >
      <p className={cn("flex items-center gap-2 text-sm font-semibold", correct ? "text-success" : "text-danger")}>
        {correct ? (
          <CheckCircle2 className="size-4 rounded-full glow-success" aria-hidden />
        ) : (
          <XCircle className="size-4" aria-hidden />
        )}
        {correct ? "Correct" : "Not quite"}
        {explanation.errorKind && (
          <span className="ml-auto inline-flex h-6 items-center rounded-full border border-border bg-surface px-2 text-[11px] font-medium capitalize text-muted">
            {explanation.errorKind} error
          </span>
        )}
      </p>

      {!correct && picked?.feedback && (
        <p className="text-sm leading-relaxed">
          <QuizText text={picked.feedback} />
        </p>
      )}

      <p className="text-sm leading-relaxed text-foreground/90">
        <QuizText text={explanation.summary} />
      </p>

      {explanation.diagnostic && (
        <pre className="overflow-x-auto rounded-lg border border-danger/30 bg-code px-3 py-2 font-mono text-[12px] leading-5 text-danger">
          {explanation.diagnostic}
        </pre>
      )}

      {question.type === "output_prediction" && <ConsoleOutput output={question.expectedOutput} />}
      {question.type === "syntax_fix" && <QuizCode code={question.fixedCode} language={question.language} label="Fixed code" />}

      {explanation.takeaway && (
        <p className="flex items-start gap-2 text-sm">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-heap" aria-hidden />
          <span className="font-medium">
            <QuizText text={explanation.takeaway} />
          </span>
        </p>
      )}

      {lesson && (
        <Link
          href={`/modules/${lesson.module.id}`}
          onClick={() => setActiveLesson(lesson.module.id, lesson.lesson.id)}
          className={cn("inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-accent hover:underline", focusRing)}
        >
          <BookOpen className="size-3.5" aria-hidden />
          Review lesson <span className="font-mono">{lessonNumber(lesson)}</span> {lesson.lesson.title}
        </Link>
      )}
    </motion.div>
  );
}
