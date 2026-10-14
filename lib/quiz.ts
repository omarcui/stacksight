import { quizData } from "@/data/quizData";
import {
  CODE_FILL_BLANK_PATTERN,
  type CodeFillQuestion,
  type ModuleQuiz,
  type QuizBlank,
  type QuizDifficulty,
  type QuizQuestion,
} from "@/types/quiz";

// Quiz engine helpers: lookup, grading, timing and template parsing.

export function getQuizById(id: string): ModuleQuiz | undefined {
  return quizData.find((q) => q.id === id);
}

// ---------------------------------------------------------------------------
// Answers & grading
// ---------------------------------------------------------------------------

/** A learner's response: a picked option, or typed text per blank ID. */
export type QuizAnswer = { kind: "choice"; optionId: string } | { kind: "fill"; values: Record<string, string> };

export type QuestionOutcome = {
  questionId: string;
  answer: QuizAnswer | null;
  correct: boolean;
};

export type QuizAttempt = {
  outcomes: QuestionOutcome[];
  correctCount: number;
  total: number;
  /** Rounded percentage, 0–100. */
  score: number;
  elapsedSeconds: number;
  /** True when the countdown ended the attempt. */
  timedOut: boolean;
};

export function isBlankCorrect(blank: QuizBlank, value: string | undefined) {
  const typed = (value ?? "").trim();
  if (!typed) return false;
  return blank.acceptedAnswers.some((a) =>
    blank.caseSensitive ? a.trim() === typed : a.trim().toLowerCase() === typed.toLowerCase(),
  );
}

export function isAnswerCorrect(question: QuizQuestion, answer: QuizAnswer | null) {
  if (!answer) return false;
  if (question.type === "code_fill") {
    return answer.kind === "fill" && question.blanks.every((b) => isBlankCorrect(b, answer.values[b.id]));
  }
  return answer.kind === "choice" && answer.optionId === question.correctOptionId;
}

/** True once every blank has text, or an option is picked. */
export function isAnswerComplete(question: QuizQuestion, answer: QuizAnswer | null) {
  if (!answer) return false;
  if (question.type === "code_fill") {
    return answer.kind === "fill" && question.blanks.every((b) => (answer.values[b.id] ?? "").trim() !== "");
  }
  return answer.kind === "choice";
}

export function gradeAttempt(
  quiz: ModuleQuiz,
  answers: Record<string, QuizAnswer>,
  elapsedSeconds: number,
  timedOut: boolean,
): QuizAttempt {
  const outcomes = quiz.questions.map((q) => {
    const answer = answers[q.id] ?? null;
    return { questionId: q.id, answer, correct: isAnswerCorrect(q, answer) };
  });
  const correctCount = outcomes.filter((o) => o.correct).length;
  const total = quiz.questions.length;
  return {
    outcomes,
    correctCount,
    total,
    score: total > 0 ? Math.round((correctCount / total) * 100) : 0,
    elapsedSeconds,
    timedOut,
  };
}

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------

const SECONDS_BY_DIFFICULTY: Record<QuizDifficulty, number> = { easy: 45, medium: 75, hard: 105 };

/** Whole-quiz countdown, budgeted per question by difficulty. */
export function quizTimeLimit(quiz: ModuleQuiz) {
  return quiz.questions.reduce((sum, q) => sum + SECONDS_BY_DIFFICULTY[q.difficulty], 0);
}

/** "m:ss", e.g. 75 → "1:15". */
export function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Code-fill templates
// ---------------------------------------------------------------------------

export type TemplateSegment = { kind: "code"; text: string } | { kind: "blank"; blankId: string };

/** Splits a code_fill template into lines of code text and `{{id}}` blanks. */
export function parseTemplate(template: string): TemplateSegment[][] {
  const marker = new RegExp(CODE_FILL_BLANK_PATTERN.source);
  return template.split("\n").map((line) =>
    // split() with a capture group interleaves text (even) and blank IDs (odd).
    line
      .split(marker)
      .map((part, i): TemplateSegment => (i % 2 ? { kind: "blank", blankId: part } : { kind: "code", text: part }))
      .filter((seg) => seg.kind === "blank" || seg.text !== ""),
  );
}

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

export function describeAnswer(question: QuizQuestion, answer: QuizAnswer | null): string {
  if (question.type === "code_fill") {
    if (answer?.kind !== "fill") return "No answer";
    return question.blanks.map((b) => answer.values[b.id]?.trim() || "—").join(" · ");
  }
  if (answer?.kind !== "choice") return "No answer";
  return question.options.find((o) => o.id === answer.optionId)?.text ?? "No answer";
}

export function describeCorrectAnswer(question: QuizQuestion): string {
  if (question.type === "code_fill") return question.blanks.map((b) => b.acceptedAnswers[0]).join(" · ");
  return question.options.find((o) => o.id === question.correctOptionId)?.text ?? "";
}

export function isCodeFill(question: QuizQuestion): question is CodeFillQuestion {
  return question.type === "code_fill";
}

export const QUIZ_TYPE_LABELS: Record<QuizQuestion["type"], string> = {
  multiple_choice: "Multiple choice",
  syntax_fix: "Fix the syntax",
  output_prediction: "Predict the output",
  code_fill: "Fill in the code",
};
