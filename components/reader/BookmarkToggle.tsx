"use client";

import { motion } from "framer-motion";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCourseStore, useCourseStoreHydrated } from "@/store/useCourseStore";
import type { ModuleId } from "@/types/curriculum";

/** Header toggle that stars the current lesson; bookmarks surface on the dashboard. */
export function BookmarkToggle({ moduleId, lessonId }: { moduleId: ModuleId; lessonId: string }) {
  const hydrated = useCourseStoreHydrated();
  const stored = useCourseStore((s) => s.bookmarks.some((b) => b.lessonId === lessonId));
  const toggleBookmark = useCourseStore((s) => s.toggleBookmark);
  const bookmarked = hydrated && stored;
  const label = bookmarked ? "Remove bookmark" : "Bookmark lesson";

  return (
    <button
      type="button"
      onClick={() => toggleBookmark(moduleId, lessonId)}
      disabled={!hydrated}
      aria-pressed={bookmarked}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-9 place-items-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-default disabled:opacity-60",
        bookmarked
          ? "border-stack/40 bg-stack/15 text-stack"
          : "border-border bg-surface text-muted hover:bg-surface-muted hover:text-foreground",
      )}
    >
      <motion.span key={String(bookmarked)} initial={{ scale: 0.6 }} animate={{ scale: 1 }}>
        <Bookmark className={cn("size-4", bookmarked && "fill-current")} aria-hidden />
      </motion.span>
    </button>
  );
}
