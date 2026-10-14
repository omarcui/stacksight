import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { ProgressAnalytics } from "@/components/progress/progress-analytics";

export const metadata: Metadata = { title: "Progress" };

// Server shell; the analytics read the persisted course store on the client
// and show skeletons until it has loaded.
export default function ProgressPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Analytics"
        title="Your Progress"
        description="Completion per module, quiz score averages, topics to review, and every lesson you've finished."
      />
      <ProgressAnalytics />
    </PageContainer>
  );
}
