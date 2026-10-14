"use client";

import { useEffect } from "react";
import { useCourseStore, useCourseStoreHydrated } from "@/store/useCourseStore";
import type { ModuleId } from "@/types/curriculum";

/** Records the module being viewed as the learner's active module. Renders nothing. */
export function TrackActiveModule({ moduleId }: { moduleId: ModuleId }) {
  const hydrated = useCourseStoreHydrated();

  useEffect(() => {
    // Wait for persisted state, otherwise rehydration would overwrite this update.
    if (!hydrated) return;
    const { activeModuleId, setActiveLesson } = useCourseStore.getState();
    // Keep the remembered lesson when revisiting the same module.
    if (activeModuleId !== moduleId) setActiveLesson(moduleId);
  }, [hydrated, moduleId]);

  return null;
}
