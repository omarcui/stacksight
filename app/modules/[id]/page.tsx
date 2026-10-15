import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { curriculumData } from "@/data/curriculumData";
import { getModuleById } from "@/lib/curriculum-utils";
import { TrackActiveModule } from "@/components/course/track-active-module";
import { ModuleReader } from "@/components/reader/ModuleReader";

// The route segment is the curriculum module ID, e.g. /modules/module-1.
export function generateStaticParams() {
  return curriculumData.map((mod) => ({ id: mod.id }));
}

export async function generateMetadata({ params }: PageProps<"/modules/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: getModuleById(curriculumData, id)?.title ?? "Module not found" };
}

// Lesson reader: full-width lesson pane; the unit outline lives in the sidebar. See docs/ui-spec.md §3.5.
export default async function ModulePage({ params }: PageProps<"/modules/[id]">) {
  const { id } = await params;
  const mod = getModuleById(curriculumData, id);
  if (!mod) notFound();

  return (
    <>
      <ModuleReader mod={mod} />
      <TrackActiveModule moduleId={mod.id} />
    </>
  );
}
