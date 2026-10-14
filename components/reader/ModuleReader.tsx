"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check, ClipboardCheck, Clock } from "lucide-react";
import { flattenLessons, getDeliverables, lessonNumber, moduleNumber, type LessonLocation } from "@/lib/curriculum-utils";
import { cn } from "@/lib/utils";
import { subtopicKey, useCourseStore, useCourseStoreHydrated } from "@/store/useCourseStore";
import type { ContentBlock, ContentType, Module, ModuleId } from "@/types/curriculum";
import { BookmarkToggle } from "./BookmarkToggle";
import { ContentBlockRenderer } from "./ContentBlockRenderer";
import { DeliverableCard } from "./DeliverableCard";
import { LessonNav } from "./LessonNav";
import { UnitAccordion } from "./UnitAccordion";

// Lesson reader: unit accordion beside the active lesson pane (docs/ui-spec.md §3.5).

const EMPTY: string[] = [];

const paneHeaderClass = "flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border px-4";
const eyebrowClass = "text-[11px] font-semibold uppercase tracking-wider text-muted";
const secondaryButton =
  "inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-default disabled:opacity-60";

export function ModuleReader({ mod }: { mod: Module }) {
  const hydrated = useCourseStoreHydrated();
  const activeModuleId = useCourseStore((s) => s.activeModuleId);
  const activeLessonId = useCourseStore((s) => s.activeLessonId);
  const setActiveLesson = useCourseStore((s) => s.setActiveLesson);
  const completedIds = useCourseStore((s) => s.progress[mod.id]?.completedLessons ?? EMPTY);
  const completed = useMemo(() => new Set(hydrated ? completedIds : EMPTY), [hydrated, completedIds]);

  const locations = useMemo(() => flattenLessons([mod]), [mod]);

  // The store owns the selected lesson so sidebar and dashboard links can open one directly.
  const remembered =
    hydrated && activeModuleId === mod.id ? locations.find((l) => l.lesson.id === activeLessonId) : undefined;
  const current = remembered ?? locations[0];

  if (!current) {
    return <p className="p-6 text-sm text-muted">This module has no lessons yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3 px-3 pb-6 pt-4 sm:px-4 lg:h-[calc(100dvh-3.5rem)] lg:pb-4">
      <ReaderHeader moduleId={mod.id} moduleTitle={mod.title} location={current} done={completed.has(current.lesson.id)} />

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <UnitAccordion
          mod={mod}
          activeUnitId={current.unit.id}
          activeLessonId={current.lesson.id}
          completed={completed}
          ready={hydrated}
          onSelect={(lessonId) => setActiveLesson(mod.id, lessonId)}
        />
        <LessonPane mod={mod} location={current} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header: breadcrumb + actions
// ---------------------------------------------------------------------------

function ReaderHeader({
  moduleId,
  moduleTitle,
  location,
  done,
}: {
  moduleId: ModuleId;
  moduleTitle: string;
  location: LessonLocation;
  done: boolean;
}) {
  const hydrated = useCourseStoreHydrated();
  const markLessonComplete = useCourseStore((s) => s.markLessonComplete);

  return (
    <header className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="flex min-w-0 flex-col gap-0.5 text-base sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:text-lg">
        <span className="text-muted">
          Module {moduleNumber(moduleId)}: {moduleTitle}
        </span>
        <ArrowRight className="hidden size-4 shrink-0 text-muted sm:block" aria-hidden />
        <span className="font-semibold">
          <span className="font-mono">{lessonNumber(location)}</span> {location.lesson.title}
        </span>
      </h1>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <BookmarkToggle moduleId={moduleId} lessonId={location.lesson.id} />
        <button
          type="button"
          onClick={() => markLessonComplete(moduleId, location.lesson.id)}
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
    </header>
  );
}

// ---------------------------------------------------------------------------
// Active lesson pane
// ---------------------------------------------------------------------------

function LessonPane({ mod, location }: { mod: Module; location: LessonLocation }) {
  const { unit, lesson, unitIndex } = location;
  const scrollRef = useRef<HTMLDivElement>(null);
  const hydrated = useCourseStoreHydrated();
  const markSubtopicComplete = useCourseStore((s) => s.markSubtopicComplete);
  const subtopicIds = useCourseStore((s) => s.progress[mod.id]?.completedSubtopics ?? EMPTY);
  const doneSubtopics = useMemo(() => new Set(hydrated ? subtopicIds : EMPTY), [hydrated, subtopicIds]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [lesson.id]);

  return (
    <article
      aria-labelledby="lesson-title"
      className="flex min-h-0 flex-col rounded-2xl border border-border bg-surface"
    >
      <div className={paneHeaderClass}>
        <span className={cn(eyebrowClass, "truncate")}>
          Unit {unitIndex + 1} · {unit.title}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-xs tabular-nums text-muted">
          <Clock className="size-3.5" aria-hidden />
          {lesson.estimatedMinutes} min
        </span>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-8">
          <header className="space-y-1.5">
            <p className="font-mono text-[11px] text-muted">Lesson {lessonNumber(location)}</p>
            <h2 id="lesson-title" className="text-2xl font-semibold tracking-tight">
              {lesson.title}
            </h2>
            <p className="text-sm leading-relaxed text-muted">{lesson.description}</p>
          </header>

          <div className="space-y-6">
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
            <section aria-labelledby="takeaways-heading" className="rounded-xl border border-border bg-surface-muted/50 p-4">
              <h3 id="takeaways-heading" className={eyebrowClass}>
                Key takeaways
              </h3>
              <ul className="mt-2 space-y-1.5 text-sm leading-relaxed">
                {lesson.keyTakeaways.map((t) => (
                  <li key={t} className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted" aria-hidden />
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
    <section aria-labelledby={headingId} className="space-y-2">
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
