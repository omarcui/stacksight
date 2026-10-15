// Course engine data model: Module → Unit → Lesson → ContentBlock.
// Helpers for lookups, navigation and validation live in lib/curriculum-utils.ts.

// ---------------------------------------------------------------------------
// Enums & unions
// ---------------------------------------------------------------------------

export const MODULE_IDS = [
  "module-1",
  "module-2",
  "module-3",
  "module-4",
  "module-5",
  "module-6",
] as const;
export type ModuleId = (typeof MODULE_IDS)[number];

export const CONTENT_TYPES = ["text", "code", "callout", "formula", "interactive", "quiz_preview"] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const CALLOUT_VARIANTS = ["info", "warning", "tip", "error_pitfall"] as const;
export type CalloutVariant = (typeof CALLOUT_VARIANTS)[number];

export const QUIZ_TYPES = ["multiple_choice", "syntax_fix", "output_prediction", "code_fill"] as const;
export type QuizType = (typeof QUIZ_TYPES)[number];

/**
 * Keys of the interactive widget registry in components/reader/ContentBlockRenderer.tsx.
 * The registry is typed `Record<WidgetId, …>`, so the compiler keeps the two in sync
 * without the validator having to import any React components.
 */
export const WIDGET_IDS = [
  "jvm-arch",
  "execution-lifecycle",
  "flowchart-runner",
  "code-anatomy",
  "syntax-fixer",
  "primitive-memory",
  "type-casting",
  "stack-tracker",
  "exponential-eval",
  "printf-builder",
  "decision-branch",
  "loop-debugger",
] as const;
export type WidgetId = (typeof WIDGET_IDS)[number];

// ---------------------------------------------------------------------------
// Content blocks
// ---------------------------------------------------------------------------

/**
 * Every field a block may carry. Renderers should switch on `type` to get a
 * narrowed {@link ContentBlock} variant whose required fields are guaranteed.
 */
export interface ContentBlockBase {
  /** Unique within its lesson; used as the React key and for deep links. */
  id: string;
  type: ContentType;
  /** Markdown body (text, callout) or prompt (quiz_preview). */
  text?: string;
  code?: string;
  /** Syntax-highlighting language, e.g. "java". */
  language?: string;
  caption?: string;
  variant?: CalloutVariant;
  /** LaTeX source without surrounding delimiters. */
  latex?: string;
  /** Key into the interactive widget registry. */
  interactiveWidgetId?: string;
  /** Quiz format teased by a quiz_preview block. */
  quizType?: QuizType;
}

export interface TextBlock extends ContentBlockBase {
  type: "text";
  text: string;
}

export interface CodeBlock extends ContentBlockBase {
  type: "code";
  code: string;
  language: string;
}

export interface CalloutBlock extends ContentBlockBase {
  type: "callout";
  variant: CalloutVariant;
  text: string;
}

export interface FormulaBlock extends ContentBlockBase {
  type: "formula";
  latex: string;
}

export interface InteractiveBlock extends ContentBlockBase {
  type: "interactive";
  interactiveWidgetId: WidgetId;
}

export interface QuizPreviewBlock extends ContentBlockBase {
  type: "quiz_preview";
  text: string;
}

/** Discriminated on `type`; all optional base fields remain readable on any variant. */
export type ContentBlock =
  | TextBlock
  | CodeBlock
  | CalloutBlock
  | FormulaBlock
  | InteractiveBlock
  | QuizPreviewBlock;

/** Narrow a block union by its `type`, e.g. `BlockOfType<"code">`. */
export type BlockOfType<T extends ContentType> = Extract<ContentBlock, { type: T }>;

// ---------------------------------------------------------------------------
// Course structure
// ---------------------------------------------------------------------------

export interface Lesson {
  /** Unique across the whole course; persisted in the course store. */
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  blocks: ContentBlock[];
  keyTakeaways: string[];
}

export interface Unit {
  /** Unique across the whole course. */
  id: string;
  title: string;
  /** Source lecture slides this unit covers, e.g. "Week 3, slides 12–24". */
  slideReference: string;
  lessons: Lesson[];
}

export interface ModuleDeliverable {
  title: string;
  description: string;
  /** Expected submission filename, e.g. "LinkedListLab.java". */
  filename: string;
  /** Lab manual exercise this file answers, e.g. "Lab 4, Exercise 4.2". */
  labReference?: string;
}

export interface Module {
  id: ModuleId;
  title: string;
  subtitle: string;
  description: string;
  /** lucide-react icon export name, e.g. "Boxes". */
  iconName: string;
  units: Unit[];
  /** Every file the module's lab asks for, in exercise order. */
  deliverable: ModuleDeliverable[];
}

export type Curriculum = readonly Module[];

export interface CurriculumPhase {
  id: string;
  title: string;
  moduleIds: ModuleId[];
}
