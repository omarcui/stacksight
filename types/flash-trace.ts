// Flash-Trace data model: a flat bank of rapid-fire output/state prediction questions.
// The bank lives in data/flashTraceData.ts; the game is components/flash-trace/FlashTraceModal.tsx.

import type { ModuleId } from "@/types/curriculum";

export const FLASH_TRACE_DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type FlashTraceDifficulty = (typeof FLASH_TRACE_DIFFICULTIES)[number];

/** Number of answer choices per question; matches the 1–4 hotkeys. */
export const FLASH_TRACE_OPTION_COUNT = 4;

export interface FlashTraceQuestion {
  /** Unique within the bank, e.g. "ft-07". */
  id: string;
  /** Short prompt, e.g. "What prints?". */
  title: string;
  /** 3–5 lines of Java. */
  codeSnippet: string;
  /** Exactly {@link FLASH_TRACE_OPTION_COUNT} concise choices. */
  options: string[];
  /** Index into `options`, 0–3. */
  correctAnswer: number;
  /** One-sentence breakdown shown after answering. */
  explanation: string;
  /** Module the question exercises; misses flag it as a weak topic. */
  topicTag: ModuleId;
  difficulty: FlashTraceDifficulty;
}
