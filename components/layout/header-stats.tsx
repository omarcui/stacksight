"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { curriculumData } from "@/data/curriculumData";
import { cn } from "@/lib/utils";
import {
  useCourseStats,
  useCourseStoreHydrated,
  useWeakModuleIds,
} from "@/store/useCourseStore";

const pillClass =
  "flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

/** Global stats badges in the header bar (docs/ui-spec.md §3.1). */
export function HeaderStats() {
  const hydrated = useCourseStoreHydrated();
  const { percent, completedModules, completedLessons, totalLessons } = useCourseStats();
  const weakCount = useWeakModuleIds().length;
  // Until persisted progress loads, render neutral values so prerendered HTML matches.
  const value = hydrated ? percent : 0;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <Link
        href="/progress"
        title={hydrated ? `${completedLessons} of ${totalLessons} lessons complete` : "Course progress"}
        className={cn(pillClass, "border-border bg-surface hover:border-border-strong")}
      >
        <span className="tabular-nums">
          <span className="text-foreground">{hydrated ? completedModules : "–"}</span>
          <span className="text-muted">/{curriculumData.length}</span>
          <span className="hidden text-muted sm:inline"> modules complete</span>
        </span>
        <span
          role="progressbar"
          aria-label="Course completion"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          className="relative hidden h-1.5 w-16 overflow-hidden rounded-full bg-surface-muted md:block"
        >
          <motion.span
            className="absolute inset-y-0 left-0 rounded-full bg-success"
            initial={false}
            animate={{ width: `${value}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </span>
      </Link>

      <Link
        href="/#weak-topics"
        aria-label={hydrated ? `Weak topics: ${weakCount}` : "Weak topics"}
        title="Modules with a latest quiz score below 60%"
        className={cn(pillClass, "border-heap/30 bg-heap/10 text-heap hover:bg-heap/15")}
      >
        <Star className="size-3.5 fill-current" aria-hidden />
        <span className="hidden sm:inline">Weak topics</span>
        <span className="tabular-nums">
          {hydrated ? weakCount : "–"}
        </span>
      </Link>
    </div>
  );
}
