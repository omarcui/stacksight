"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { curriculumData } from "@/data/curriculumData";
import { findLesson, getAdjacentLessons, lessonNumber, moduleNumber, type LessonLocation } from "@/lib/curriculum-utils";
import { cn } from "@/lib/utils";
import { useCourseStore, useCourseStoreHydrated } from "@/store/useCourseStore";

/** Previous/next lesson in reading order. Crossing into another module navigates to its route. */
export function LessonNav({ lessonId }: { lessonId: string }) {
  const { previous, next } = getAdjacentLessons(curriculumData, lessonId);
  if (!previous && !next) return null;
  const moduleId = findLesson(curriculumData, lessonId)?.module.id;

  return (
    <nav aria-label="Lesson navigation" className="grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
      {previous && <NavCard direction="previous" target={previous} fromModuleId={moduleId} />}
      {next && <NavCard direction="next" target={next} fromModuleId={moduleId} />}
    </nav>
  );
}

function NavCard({
  direction,
  target,
  fromModuleId,
}: {
  direction: "previous" | "next";
  target: LessonLocation;
  fromModuleId: string | undefined;
}) {
  const hydrated = useCourseStoreHydrated();
  const setActiveLesson = useCourseStore((s) => s.setActiveLesson);
  const targetModuleId = target.module.id;
  const crossesModule = target.module.id !== fromModuleId;
  const isNext = direction === "next";
  const Arrow = isNext ? ArrowRight : ArrowLeft;

  const eyebrow = crossesModule ? (isNext ? "Next module" : "Previous module") : isNext ? "Next lesson" : "Previous lesson";
  const className = cn(
    "group flex items-center gap-3 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
    isNext && "hover:border-accent/50 sm:col-start-2 sm:flex-row-reverse sm:text-right",
    !hydrated && "pointer-events-none opacity-60",
  );

  const body = (
    <>
      <Arrow
        className={cn(
          "size-4 shrink-0 text-muted transition-transform group-hover:text-foreground",
          isNext ? "group-hover:translate-x-0.5" : "group-hover:-translate-x-0.5",
        )}
        aria-hidden
      />
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted">{eyebrow}</span>
        <span className="mt-0.5 block truncate text-sm font-semibold leading-snug">
          <span className="mr-1.5 font-mono text-xs font-normal text-muted">
            {crossesModule && `${moduleNumber(targetModuleId)} | `}
            {lessonNumber(target)}
          </span>
          {target.lesson.title}
        </span>
      </span>
    </>
  );

  const select = () => setActiveLesson(targetModuleId, target.lesson.id);

  if (crossesModule) {
    return (
      <Link href={`/modules/${targetModuleId}`} onClick={select} aria-disabled={!hydrated} className={className}>
        {body}
      </Link>
    );
  }
  return (
    <button type="button" onClick={select} disabled={!hydrated} className={className}>
      {body}
    </button>
  );
}
