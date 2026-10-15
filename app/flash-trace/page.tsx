import type { Metadata } from "next";
import { FlashTraceLanding } from "@/components/flash-trace/FlashTraceLanding";
import { PageContainer, PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Flash-Trace" };

// Server shell; the landing opens the shared Flash-Trace modal on mount.
export default function FlashTracePage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Challenge"
        title="Flash-Trace"
        description="Two minutes of rapid-fire Java: predict outputs, trace operators and catch compile errors before the clock runs out."
      />
      <FlashTraceLanding />
    </PageContainer>
  );
}
