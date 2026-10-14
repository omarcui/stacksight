import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen } from "lucide-react";
import { curriculumData } from "@/data/curriculumData";
import { quizData } from "@/data/quizData";
import { getModuleById, moduleNumber } from "@/lib/curriculum-utils";
import { getQuizById } from "@/lib/quiz";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { QuizSession } from "@/components/quiz/QuizSession";

// One quiz per module; quiz IDs mirror module IDs, e.g. /quizzes/module-1.
export function generateStaticParams() {
  return quizData.map((quiz) => ({ id: quiz.id }));
}

export async function generateMetadata({ params }: PageProps<"/quizzes/[id]">): Promise<Metadata> {
  const { id } = await params;
  const quiz = getQuizById(id);
  return { title: quiz ? `Quiz: ${quiz.title}` : "Quiz not found" };
}

export default async function QuizPage({ params }: PageProps<"/quizzes/[id]">) {
  const { id } = await params;
  const quiz = getQuizById(id);
  const mod = getModuleById(curriculumData, id);
  if (!quiz || !mod) notFound();

  return (
    <PageContainer>
      <PageHeader eyebrow={`Quiz ${moduleNumber(mod.id)}`} title={mod.title} description={quiz.description}>
        <Link
          href={`/modules/${mod.id}`}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3.5 text-sm font-medium transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <BookOpen className="size-4" aria-hidden />
          Review module
        </Link>
      </PageHeader>
      <div className="mx-auto max-w-3xl">
        <QuizSession quiz={quiz} />
      </div>
    </PageContainer>
  );
}
