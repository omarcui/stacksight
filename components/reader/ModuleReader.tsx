"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import Link from "next/link";
import { Check, ClipboardCheck, Clock } from "lucide-react";
import { getDeliverables, lessonNumber, moduleNumber, type LessonLocation } from "@/lib/curriculum-utils";
import { cn } from "@/lib/utils";
import {
  subtopicKey,
  useCompletedLessonIds,
  useCourseStore,
  useCourseStoreHydrated,
  useCurrentLesson,
} from "@/store/useCourseStore";
import type { ContentBlock, ContentType, Module, ModuleId } from "@/types/curriculum";
import { BookmarkToggle } from "./BookmarkToggle";
import { ContentBlockRenderer } from "./ContentBlockRenderer";
import { DeliverableCard } from "./DeliverableCard";
import { LessonNav } from "./LessonNav";

// Lesson reader: full-width lesson pane; the unit/lesson outline lives in the app sidebar (docs/ui-spec.md §3.5).

const EMPTY: string[] = [];

const eyebrowClass = "text-[11px] font-semibold uppercase tracking-wider text-muted";
const secondaryButton =
  "inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-default disabled:opacity-60";

export function ModuleReader({ mod }: { mod: Module }) {
  // The store owns the selected lesson so sidebar and dashboard links can open one directly.
  const current = useCurrentLesson(mod);
  const completed = useCompletedLessonIds(mod.id);

  if (!current) {
    return <p className="p-6 text-sm text-muted">This module has no lessons yet.</p>;
  }

  return (
    <div className="px-3 pb-6 pt-4 sm:px-4 lg:pb-8">
      <LessonPane mod={mod} location={current} done={completed.has(current.lesson.id)} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toolbar: unit context + actions (the module/lesson path is in the navbar breadcrumb and sidebar)
// ---------------------------------------------------------------------------

function ReaderToolbar({
  moduleId,
  location,
  done,
}: {
  moduleId: ModuleId;
  location: LessonLocation;
  done: boolean;
}) {
  const hydrated = useCourseStoreHydrated();
  const markLessonComplete = useCourseStore((s) => s.markLessonComplete);
  const { unit, lesson, unitIndex } = location;

  return (
    <div className="sticky top-0 z-10 flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-t-2xl border-b border-border bg-surface/90 px-4 py-2.5 backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-3">
        <span className={cn(eyebrowClass, "truncate")}>
          Unit {unitIndex + 1} · {unit.title}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-xs tabular-nums text-muted">
          <Clock className="size-3.5" aria-hidden />
          {lesson.estimatedMinutes} min
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <BookmarkToggle moduleId={moduleId} lessonId={lesson.id} />
        <button
          type="button"
          onClick={() => markLessonComplete(moduleId, lesson.id)}
          disabled={!hydrated || done}
          className={cn(secondaryButton, done && "border-success/40 bg-success/10 text-success disabled:opacity-100")}
        >
          <Check className="size-4" aria-hidden />
          {done ? "Done" : "Mark complete"}
        </button>
        <Link
          href={`/quizzes/${moduleId}`}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ClipboardCheck className="size-4" aria-hidden />
          Quiz
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Active lesson pane
// ---------------------------------------------------------------------------

function LessonPane({ mod, location, done }: { mod: Module; location: LessonLocation; done: boolean }) {
  const { lesson } = location;
  const hydrated = useCourseStoreHydrated();
  const markSubtopicComplete = useCourseStore((s) => s.markSubtopicComplete);
  const subtopicIds = useCourseStore((s) => s.progress[mod.id]?.completedSubtopics ?? EMPTY);
  const doneSubtopics = useMemo(() => new Set(hydrated ? subtopicIds : EMPTY), [hydrated, subtopicIds]);

  // <main> is the only scroll container (components/layout/app-shell.tsx); start each lesson at the top.
  useEffect(() => {
    document.getElementById("main-content")?.scrollTo({ top: 0 });
  }, [lesson.id]);

  return (
    <article aria-labelledby="lesson-title" className="rounded-2xl border border-border bg-surface">
      <ReaderToolbar moduleId={mod.id} location={location} done={done} />

      <div className="px-4 py-8 sm:px-8 md:py-10 lg:px-12">
        <div className="mx-auto max-w-5xl space-y-8 md:space-y-10">
          <header className="space-y-2 border-b border-border pb-6 md:pb-8">
            <p className="font-mono text-xs text-muted">Lesson {lessonNumber(location)}</p>
            <h1 id="lesson-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {lesson.title}
            </h1>
            <p className="max-w-3xl text-base leading-relaxed text-muted md:text-lg">{lesson.description}</p>
          </header>

          <div className="space-y-6 md:space-y-8">
            {lesson.blocks.map((block, i) => (
              <BlockSection
                key={block.id}
                block={block}
                index={i}
                done={doneSubtopics.has(subtopicKey(lesson.id, block.id))}
                ready={hydrated}
                onComplete={() => markSubtopicComplete(mod.id, lesson.id, block.id)}
              >
                <ContentBlockRenderer block={block} moduleId={mod.id} />
              </BlockSection>
            ))}
          </div>

          {lesson.keyTakeaways.length > 0 && (
            <section aria-labelledby="takeaways-heading" className="rounded-xl border border-border bg-surface-muted/50 p-5">
              <h3 id="takeaways-heading" className={eyebrowClass}>
                Key takeaways
              </h3>
              <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-foreground/90 md:text-base">
                {lesson.keyTakeaways.map((t) => (
                  <li key={t} className="flex gap-3">
                    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-muted" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <DeliverableCard deliverables={getDeliverables(mod)} labNumber={Number(moduleNumber(mod.id))} />

          <LessonNav lessonId={lesson.id} />
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Block heading: index, kind and a sub-topic completion check
// ---------------------------------------------------------------------------

const BLOCK_KINDS: Record<ContentType, string> = {
  text: "Reading",
  code: "Example",
  callout: "Note",
  formula: "Formula",
  interactive: "Try it",
  quiz_preview: "Quiz",
};

function BlockSection({
  block,
  index,
  done,
  ready,
  onComplete,
  children,
}: {
  block: ContentBlock;
  index: number;
  done: boolean;
  /** False until the store has hydrated; the check is disabled before that. */
  ready: boolean;
  onComplete: () => void;
  children: ReactNode;
}) {
  const headingId = `block-${block.id}`;
  const number = String(index + 1).padStart(2, "0");
  const kind = BLOCK_KINDS[block.type];

  return (
    <section aria-labelledby={headingId} className="scroll-mt-20 space-y-3">
      <div className="flex items-center gap-2">
        <h3 id={headingId} className={cn(eyebrowClass, "flex items-center gap-2", done && "text-success")}>
          <span className="font-mono">{number}</span>
          {kind}
        </h3>
        <span className="h-px flex-1 bg-border" aria-hidden />
        <button
          type="button"
          onClick={onComplete}
          disabled={!ready || done}
          aria-label={done ? `${kind} ${number} completed` : `Mark ${kind.toLowerCase()} ${number} as complete`}
          title={done ? "Completed" : "Mark as complete"}
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-default",
            done
              ? "border-success bg-success text-role-foreground"
              : "border-border-strong text-muted hover:border-success/60 hover:bg-success/10 hover:text-success disabled:opacity-60 disabled:hover:border-border-strong disabled:hover:bg-transparent disabled:hover:text-muted",
          )}
        >
          <Check className="size-3.5" strokeWidth={3} aria-hidden />
        </button>
      </div>
      {children}
    </section>
  );
}
