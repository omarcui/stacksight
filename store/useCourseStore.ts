"use client";

import { useMemo, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { curriculumData } from "@/data/curriculumData";
import {
  countTotalLessons,
  findLesson,
  findModuleLesson,
  flattenLessons,
  getModuleById,
  getModuleLessons,
  isModuleId,
  type LessonLocation,
} from "@/lib/curriculum-utils";
import type { Module, ModuleId } from "@/types/curriculum";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ModuleProgress = {
  /** Lesson IDs from data/curriculumData.ts, e.g. "m1-u1-l1". */
  completedLessons: string[];
  /** Content blocks read inside a lesson, keyed by {@link subtopicKey}. */
  completedSubtopics: string[];
};

export type QuizResult = {
  /** Latest score, as a percentage 0–100. */
  score: number;
  bestScore: number;
  attempts: number;
  /** Epoch ms of the latest attempt. */
  takenAt: number;
};

export type CodeSnippet = {
  id: string;
  title: string;
  code: string;
  savedAt: number;
};

type CourseData = {
  progress: Partial<Record<ModuleId, ModuleProgress>>;
  quizScores: Partial<Record<ModuleId, QuizResult>>;
  activeModuleId: ModuleId | null;
  activeLessonId: string | null;
  /** Current (unsaved) editor buffer in the sandbox. */
  sandboxCode: string;
  savedSnippets: CodeSnippet[];
  /** Starred lessons, most recent first, as `{ moduleId, lessonId }`. */
  bookmarks: LessonRef[];
  /** Epoch ms each lesson was first completed, keyed by lesson ID. */
  lessonCompletedAt: Record<string, number>;
  /** Best Flash-Trace session score. */
  flashTraceHighScore: number;
  /** Longest run of consecutive correct Flash-Trace answers. */
  flashTraceBestStreak: number;
  /** Completed Flash-Trace sessions. */
  flashTraceSessionsCount: number;
  /**
   * Modules flagged by missed Flash-Trace questions, in curriculum order. Combined with
   * low quiz scores in {@link useWeakModuleIds}.
   */
  weakTopics: ModuleId[];
};

export type LessonRef = { moduleId: ModuleId; lessonId: string };

// Actions accept plain strings (route params, persisted values) and ignore any
// ID that does not resolve against data/curriculumData.ts.
type CourseActions = {
  markLessonComplete: (moduleId: string, lessonId: string) => void;
  /** `subtopicId` is the ID of a content block inside the lesson. */
  markSubtopicComplete: (moduleId: string, lessonId: string, subtopicId: string) => void;
  saveQuizScore: (moduleId: string, score: number) => void;
  setActiveLesson: (moduleId: string, lessonId?: string | null) => void;
  updateSandboxCode: (code: string) => void;
  saveSnippet: (title: string, code?: string) => void;
  deleteSnippet: (id: string) => void;
  toggleBookmark: (moduleId: string, lessonId: string) => void;
  /**
   * Records a finished Flash-Trace session. Modules in `missedTopicTags` are flagged as
   * weak topics; modules in `clearedTopicTags` (answered, never missed) lose the flag.
   */
  saveFlashTraceResult: (
    score: number,
    streak: number,
    missedTopicTags: ModuleId[],
    clearedTopicTags?: ModuleId[],
  ) => void;
  resetProgress: () => void;
};

export type CourseState = CourseData & CourseActions;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const DEFAULT_SANDBOX_CODE = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, StackSight!");
    }
}
`;

const initialData: CourseData = {
  progress: {},
  quizScores: {},
  activeModuleId: null,
  activeLessonId: null,
  sandboxCode: DEFAULT_SANDBOX_CODE,
  savedSnippets: [],
  bookmarks: [],
  lessonCompletedAt: {},
  flashTraceHighScore: 0,
  flashTraceBestStreak: 0,
  flashTraceSessionsCount: 0,
  weakTopics: [],
};

const EMPTY_MODULE_PROGRESS: ModuleProgress = { completedLessons: [], completedSubtopics: [] };

function addUnique(list: string[], ...items: string[]) {
  const next = new Set(list);
  items.forEach((item) => next.add(item));
  return next.size === list.length ? list : [...next];
}

/** Records the first completion time of a lesson; later completions keep it. */
function stampCompletion(stamps: Record<string, number>, lessonId: string) {
  return lessonId in stamps ? stamps : { ...stamps, [lessonId]: Date.now() };
}

/** Block IDs are only unique within a lesson, so sub-topic progress is keyed by both. */
export function subtopicKey(lessonId: string, blockId: string) {
  return `${lessonId}#${blockId}`;
}

export const useCourseStore = create<CourseState>()(
  persist(
    (set) => ({
      ...initialData,

      markLessonComplete: (moduleId, lessonId) =>
        set((state) => {
          const loc = findModuleLesson(curriculumData, moduleId, lessonId);
          if (!loc) return state;
          const id = loc.module.id;
          const current = state.progress[id] ?? EMPTY_MODULE_PROGRESS;
          return {
            progress: {
              ...state.progress,
              [id]: {
                completedLessons: addUnique(current.completedLessons, lessonId),
                // Completing a lesson implies all of its sub-topics are done.
                completedSubtopics: addUnique(
                  current.completedSubtopics,
                  ...loc.lesson.blocks.map((b) => subtopicKey(lessonId, b.id)),
                ),
              },
            },
            lessonCompletedAt: stampCompletion(state.lessonCompletedAt, lessonId),
            activeModuleId: id,
            activeLessonId: lessonId,
          };
        }),

      markSubtopicComplete: (moduleId, lessonId, subtopicId) =>
        set((state) => {
          const loc = findModuleLesson(curriculumData, moduleId, lessonId);
          if (!loc?.lesson.blocks.some((b) => b.id === subtopicId)) return state;
          const id = loc.module.id;
          const current = state.progress[id] ?? EMPTY_MODULE_PROGRESS;
          const completedSubtopics = addUnique(current.completedSubtopics, subtopicKey(lessonId, subtopicId));
          // Finishing the last sub-topic completes the lesson.
          const lessonDone = loc.lesson.blocks.every((b) =>
            completedSubtopics.includes(subtopicKey(lessonId, b.id)),
          );
          return {
            progress: {
              ...state.progress,
              [id]: {
                completedLessons: lessonDone
                  ? addUnique(current.completedLessons, lessonId)
                  : current.completedLessons,
                completedSubtopics,
              },
            },
            lessonCompletedAt: lessonDone
              ? stampCompletion(state.lessonCompletedAt, lessonId)
              : state.lessonCompletedAt,
            activeModuleId: id,
            activeLessonId: lessonId,
          };
        }),

      saveQuizScore: (moduleId, score) =>
        set((state) => {
          if (!isModuleId(moduleId)) return state;
          const clamped = Math.round(Math.min(100, Math.max(0, score)));
          const previous = state.quizScores[moduleId];
          return {
            quizScores: {
              ...state.quizScores,
              [moduleId]: {
                score: clamped,
                bestScore: Math.max(clamped, previous?.bestScore ?? 0),
                attempts: (previous?.attempts ?? 0) + 1,
                takenAt: Date.now(),
              },
            },
          };
        }),

      setActiveLesson: (moduleId, lessonId = null) =>
        set((state) => {
          const mod = getModuleById(curriculumData, moduleId);
          if (!mod) return state;
          if (lessonId !== null && !findModuleLesson(curriculumData, mod.id, lessonId)) return state;
          return { activeModuleId: mod.id, activeLessonId: lessonId };
        }),

      updateSandboxCode: (code) => set({ sandboxCode: code }),

      saveSnippet: (title, code) =>
        set((state) => ({
          savedSnippets: [
            {
              id: crypto.randomUUID(),
              title: title.trim() || "Untitled snippet",
              code: code ?? state.sandboxCode,
              savedAt: Date.now(),
            },
            ...state.savedSnippets,
          ],
        })),

      deleteSnippet: (id) =>
        set((state) => ({ savedSnippets: state.savedSnippets.filter((s) => s.id !== id) })),

      toggleBookmark: (moduleId, lessonId) =>
        set((state) => {
          const loc = findModuleLesson(curriculumData, moduleId, lessonId);
          if (!loc) return state;
          const exists = state.bookmarks.some((b) => b.lessonId === lessonId);
          return {
            bookmarks: exists
              ? state.bookmarks.filter((b) => b.lessonId !== lessonId)
              : [{ moduleId: loc.module.id, lessonId }, ...state.bookmarks],
          };
        }),

      saveFlashTraceResult: (score, streak, missedTopicTags, clearedTopicTags = []) =>
        set((state) => {
          const missed = new Set(missedTopicTags.filter(isModuleId));
          const cleared = new Set(clearedTopicTags.filter((id) => isModuleId(id) && !missed.has(id)));
          const flagged = new Set(state.weakTopics.filter((id) => !cleared.has(id)));
          missed.forEach((id) => flagged.add(id));
          return {
            flashTraceHighScore: Math.max(state.flashTraceHighScore, Math.max(0, Math.round(score))),
            flashTraceBestStreak: Math.max(state.flashTraceBestStreak, Math.max(0, Math.floor(streak))),
            flashTraceSessionsCount: state.flashTraceSessionsCount + 1,
            weakTopics: curriculumData.map((m) => m.id).filter((id) => flagged.has(id)),
          };
        }),

      resetProgress: () =>
        set({
          progress: {},
          quizScores: {},
          lessonCompletedAt: {},
          flashTraceHighScore: 0,
          flashTraceBestStreak: 0,
          flashTraceSessionsCount: 0,
          weakTopics: [],
          activeModuleId: null,
          activeLessonId: null,
        }),
    }),
    {
      name: "stacksight-course",
      version: 2,
      migrate: migrateCourseState,
      storage: createJSONStorage(() => localStorage),
      partialize: ({
        progress,
        quizScores,
        activeModuleId,
        activeLessonId,
        sandboxCode,
        savedSnippets,
        bookmarks,
        lessonCompletedAt,
        flashTraceHighScore,
        flashTraceBestStreak,
        flashTraceSessionsCount,
        weakTopics,
      }) => ({
        progress,
        quizScores,
        activeModuleId,
        activeLessonId,
        sandboxCode,
        savedSnippets,
        bookmarks,
        lessonCompletedAt,
        flashTraceHighScore,
        flashTraceBestStreak,
        flashTraceSessionsCount,
        weakTopics,
      }),
      // Pages are prerendered with the initial state; rehydrating from localStorage
      // after mount (see useHydrateCourseStore) keeps server and client markup identical.
      skipHydration: true,
    },
  ),
);

// ---------------------------------------------------------------------------
// Persistence migrations
// ---------------------------------------------------------------------------

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const stringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];

/** v1 keyed modules by bare number ("1"); v2 uses curriculum IDs ("module-1"). */
function toModuleId(value: unknown): ModuleId | null {
  if (isModuleId(value)) return value;
  if (typeof value !== "string" && typeof value !== "number") return null;
  const candidate = `module-${value}`;
  return isModuleId(candidate) ? candidate : null;
}

/**
 * Upgrades persisted state to the current shape. v1 progress referenced the
 * placeholder outline ("1-1", "1-1-1"), which has no counterpart in
 * data/curriculumData.ts: module keys are converted ("1" → "module-1"), and any
 * lesson, sub-topic or bookmark that doesn't resolve to real content is dropped.
 */
export function migrateCourseState(persistedState: unknown, version: number): CourseData {
  const raw = isRecord(persistedState) ? persistedState : {};
  if (version >= 2) return { ...initialData, ...(raw as Partial<CourseData>) };

  const progress: CourseData["progress"] = {};
  if (isRecord(raw.progress)) {
    for (const [key, value] of Object.entries(raw.progress)) {
      const moduleId = toModuleId(key);
      const mod = moduleId ? getModuleById(curriculumData, moduleId) : undefined;
      if (!mod || !isRecord(value)) continue;

      const lessons = getModuleLessons(mod);
      const lessonIds = new Set(lessons.map((l) => l.id));
      const subtopicKeys = new Set(lessons.flatMap((l) => l.blocks.map((b) => subtopicKey(l.id, b.id))));
      const completedLessons = stringArray(value.completedLessons).filter((id) => lessonIds.has(id));
      const completedSubtopics = stringArray(value.completedSubtopics).filter((id) => subtopicKeys.has(id));

      if (completedLessons.length > 0 || completedSubtopics.length > 0) {
        progress[mod.id] = { completedLessons, completedSubtopics };
      }
    }
  }

  const quizScores: CourseData["quizScores"] = {};
  if (isRecord(raw.quizScores)) {
    for (const [key, value] of Object.entries(raw.quizScores)) {
      const moduleId = toModuleId(key);
      if (moduleId && isRecord(value) && typeof value.score === "number") {
        quizScores[moduleId] = value as QuizResult;
      }
    }
  }

  const bookmarks: LessonRef[] = [];
  if (Array.isArray(raw.bookmarks)) {
    for (const b of raw.bookmarks) {
      const loc = isRecord(b) && typeof b.lessonId === "string" ? findLesson(curriculumData, b.lessonId) : undefined;
      if (loc && !bookmarks.some((x) => x.lessonId === loc.lesson.id)) {
        bookmarks.push({ moduleId: loc.module.id, lessonId: loc.lesson.id });
      }
    }
  }

  const activeModuleId = toModuleId(raw.activeModuleId);
  const activeLessonId =
    activeModuleId &&
    typeof raw.activeLessonId === "string" &&
    findModuleLesson(curriculumData, activeModuleId, raw.activeLessonId)
      ? raw.activeLessonId
      : null;

  return {
    progress,
    quizScores,
    activeModuleId,
    activeLessonId,
    sandboxCode: typeof raw.sandboxCode === "string" ? raw.sandboxCode : DEFAULT_SANDBOX_CODE,
    savedSnippets: Array.isArray(raw.savedSnippets) ? (raw.savedSnippets as CodeSnippet[]) : [],
    bookmarks,
    // v1 never recorded completion times or Flash-Trace sessions.
    lessonCompletedAt: {},
    flashTraceHighScore: 0,
    flashTraceBestStreak: 0,
    flashTraceSessionsCount: 0,
    weakTopics: [],
  };
}

// ---------------------------------------------------------------------------
// Hydration
// ---------------------------------------------------------------------------

/** Call once near the root: loads persisted state and keeps other tabs in sync. */
export function hydrateCourseStore() {
  void useCourseStore.persist.rehydrate();

  const onStorage = (e: StorageEvent) => {
    if (e.key === useCourseStore.persist.getOptions().name) {
      void useCourseStore.persist.rehydrate();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

/** False during prerender and until persisted state has loaded on the client. */
export function useCourseStoreHydrated() {
  return useSyncExternalStore(
    (onChange) => useCourseStore.persist.onFinishHydration(onChange),
    () => useCourseStore.persist.hasHydrated(),
    () => false,
  );
}

// ---------------------------------------------------------------------------
// Derived selectors
// ---------------------------------------------------------------------------

export type ModuleStats = {
  moduleId: ModuleId;
  completedLessons: number;
  totalLessons: number;
  percent: number;
};

export type CourseStats = {
  completedLessons: number;
  totalLessons: number;
  percent: number;
  completedModules: number;
  modules: ModuleStats[];
};

const TOTAL_LESSONS = countTotalLessons(curriculumData);

function percentOf(done: number, total: number) {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

export function computeCourseStats(progress: CourseData["progress"]): CourseStats {
  const modules = curriculumData.map((m) => {
    const lessonIds = new Set(getModuleLessons(m).map((l) => l.id));
    // Count only lessons still in the curriculum, so stale persisted IDs don't inflate totals.
    const completed = (progress[m.id]?.completedLessons ?? []).filter((id) => lessonIds.has(id)).length;
    return {
      moduleId: m.id,
      completedLessons: completed,
      totalLessons: lessonIds.size,
      percent: percentOf(completed, lessonIds.size),
    };
  });
  const completedLessons = modules.reduce((sum, m) => sum + m.completedLessons, 0);

  return {
    completedLessons,
    totalLessons: TOTAL_LESSONS,
    percent: percentOf(completedLessons, TOTAL_LESSONS),
    completedModules: modules.filter((m) => m.totalLessons > 0 && m.percent === 100).length,
    modules,
  };
}

/** Overall and per-module completion, recomputed only when progress changes. */
export function useCourseStats() {
  const progress = useCourseStore((s) => s.progress);
  return useMemo(() => computeCourseStats(progress), [progress]);
}

/** A latest quiz score below this marks the module as a weak topic. */
export const WEAK_TOPIC_THRESHOLD = 60;

/** True when the module's latest quiz score is below {@link WEAK_TOPIC_THRESHOLD}. */
export function isWeakQuizResult(result: QuizResult | undefined): boolean {
  return result !== undefined && result.score < WEAK_TOPIC_THRESHOLD;
}

/**
 * Module IDs flagged as weak topics, in curriculum order: a latest quiz score below the
 * threshold, or a missed question in the latest Flash-Trace session that covered it.
 */
export function useWeakModuleIds(): ModuleId[] {
  const quizScores = useCourseStore((s) => s.quizScores);
  const weakTopics = useCourseStore((s) => s.weakTopics);
  return useMemo(
    () =>
      curriculumData
        .filter((m) => isWeakQuizResult(quizScores[m.id]) || weakTopics.includes(m.id))
        .map((m) => m.id),
    [quizScores, weakTopics],
  );
}

const NO_LESSONS: string[] = [];

/** Completed lesson IDs for a module; empty until the store has hydrated. */
export function useCompletedLessonIds(moduleId: ModuleId): ReadonlySet<string> {
  const hydrated = useCourseStoreHydrated();
  const ids = useCourseStore((s) => s.progress[moduleId]?.completedLessons ?? NO_LESSONS);
  return useMemo(() => new Set(hydrated ? ids : NO_LESSONS), [hydrated, ids]);
}

/**
 * The lesson open in a module's reader: the remembered active lesson when it belongs
 * to this module, otherwise the module's first lesson. Shared by the reader and sidebar.
 */
export function useCurrentLesson(mod: Module): LessonLocation | undefined {
  const hydrated = useCourseStoreHydrated();
  const activeModuleId = useCourseStore((s) => s.activeModuleId);
  const activeLessonId = useCourseStore((s) => s.activeLessonId);
  const locations = useMemo(() => flattenLessons([mod]), [mod]);

  const remembered =
    hydrated && activeModuleId === mod.id ? locations.find((l) => l.lesson.id === activeLessonId) : undefined;
  return remembered ?? locations[0];
}
