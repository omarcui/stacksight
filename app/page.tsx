import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import {
  BookmarkedLessons,
  PhaseRoadmap,
  RecentQuizScores,
  StatsOverview,
  WeakTopics,
} from "@/components/dashboard/dashboard-widgets";
import { curriculumData } from "@/data/curriculumData";
import { getCurriculumStats } from "@/lib/curriculum-utils";

const stats = getCurriculumStats(curriculumData);
const hours = Math.round((stats.minutes / 60) * 10) / 10;

// The page itself stays a Server Component; each widget reads the persisted
// course store on the client and shows a skeleton until it has loaded.
export default function DashboardPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Syllabus roadmap"
        title="Welcome to StackSight"
        description={`${stats.modules} modules · ${stats.lessons} lessons · about ${hours} hours of reading. Work through each module, then test yourself with its quiz.`}
      >
        <Link
          href="/progress"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3.5 text-sm font-medium transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <BarChart3 className="size-4" aria-hidden />
          View progress
        </Link>
      </PageHeader>

      <div className="space-y-8">
        <StatsOverview />
        <PhaseRoadmap />

        <div className="grid gap-3 lg:grid-cols-3">
          <WeakTopics />
          <BookmarkedLessons />
          <RecentQuizScores />
        </div>
      </div>
    </PageContainer>
  );
}
