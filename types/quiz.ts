// Quiz data model: ModuleQuiz → QuizQuestion → QuizOption / QuizExplanation.
// Question banks live in data/quizData.ts. Quiz IDs mirror module IDs.

import type { ModuleId, QuizType } from "@/types/curriculum";

export { QUIZ_TYPES } from "@/types/curriculum";
export type { QuizType } from "@/types/curriculum";

// ---------------------------------------------------------------------------
// Enums & unions
// ---------------------------------------------------------------------------

/** Error categories taught in CSC103: compile-time, run-time and wrong-result. */
export const ERROR_KINDS = ["syntax", "runtime", "logic"] as const;
export type ErrorKind = (typeof ERROR_KINDS)[number];

export const QUIZ_DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type QuizDifficulty = (typeof QUIZ_DIFFICULTIES)[number];

/** Marks a blank inside a code_fill template, e.g. `Math.{{b1}}(x)`. */
export const CODE_FILL_BLANK_PATTERN = /\{\{(\w+)\}\}/g;

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

export interface QuizOption {
  /** Unique within its question, e.g. "a". */
  id: string;
  text: string;
  /** Render `text` in monospace (code or console output). */
  isCode?: boolean;
  /** Shown when this option is picked; explains why a distractor is wrong. */
  feedback?: string;
}

export interface QuizExplanation {
  /** Markdown explaining why the correct answer is correct. */
  summary: string;
  /** Error category the question demonstrates, if any. */
  errorKind?: ErrorKind;
  /** Compiler or JVM message the buggy code produces, verbatim. */
  diagnostic?: string;
  /** One-line rule to remember. */
  takeaway?: string;
}

export interface QuizBlank {
  /** Matches a `{{id}}` marker in the question's code template. */
  id: string;
  /** Compared after trimming whitespace; first entry is the canonical answer. */
  acceptedAnswers: string[];
  caseSensitive?: boolean;
  /** Placeholder text for the input. */
  hint?: string;
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

/**
 * Every field a question may carry. Renderers should switch on `type` to get a
 * narrowed {@link QuizQuestion} variant whose required fields are guaranteed.
 */
export interface QuizQuestionBase {
  /** Unique across the whole course, e.g. "q-m3-02". */
  id: string;
  type: QuizType;
  /** Markdown question text. */
  prompt: string;
  /** Code shown with the prompt; for code_fill this is the template. */
  code?: string;
  /** Syntax-highlighting language, e.g. "java". */
  language?: string;
  difficulty: QuizDifficulty;
  /** Lesson to review on a wrong answer; matches a Lesson.id. */
  lessonId?: string;
  explanation: QuizExplanation;
}

export interface MultipleChoiceQuestion extends QuizQuestionBase {
  type: "multiple_choice";
  options: QuizOption[];
  correctOptionId: string;
}

export interface SyntaxFixQuestion extends QuizQuestionBase {
  type: "syntax_fix";
  /** Code containing the bug. */
  code: string;
  /** 1-based line of `code` holding the bug, for highlighting. */
  errorLine: number;
  /** Candidate corrected lines. */
  options: QuizOption[];
  correctOptionId: string;
  /** Full corrected program, shown after answering. */
  fixedCode: string;
}

export interface OutputPredictionQuestion extends QuizQuestionBase {
  type: "output_prediction";
  code: string;
  options: QuizOption[];
  correctOptionId: string;
  /** Exact console output, shown after answering. */
  expectedOutput: string;
}

export interface CodeFillQuestion extends QuizQuestionBase {
  type: "code_fill";
  /** Template containing one `{{id}}` marker per blank. */
  code: string;
  blanks: QuizBlank[];
  /** Optional tokens offered as tap targets; include distractors. */
  wordBank?: string[];
}

/** Discriminated on `type`. */
export type QuizQuestion =
  | MultipleChoiceQuestion
  | SyntaxFixQuestion
  | OutputPredictionQuestion
  | CodeFillQuestion;

/** Narrow a question union by its `type`, e.g. `QuestionOfType<"code_fill">`. */
export type QuestionOfType<T extends QuizType> = Extract<QuizQuestion, { type: T }>;

/** Questions answered by picking a single option. */
export type OptionQuestion = Exclude<QuizQuestion, CodeFillQuestion>;

// ---------------------------------------------------------------------------
// Quiz
// ---------------------------------------------------------------------------

export interface ModuleQuiz {
  /** Same as `moduleId`; used in the /quizzes/[id] route. */
  id: ModuleId;
  moduleId: ModuleId;
  title: string;
  description: string;
  /** Lab manual section the quiz draws on, e.g. "Lab 3". */
  labReference: string;
  /** Percentage 0–100 needed to pass. */
  passingScore: number;
  questions: QuizQuestion[];
}
