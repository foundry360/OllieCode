import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { SignedInAppHeader } from "@/components/app/SignedInAppHeader";
import { Footer } from "@/components/landing/Footer";
import { fetchLearningGuideByIdForViewer } from "@/lib/lms/learningGuides";
import { sanitizeLessonBodyHtml } from "@/lib/lms/sanitizeLessonBodyHtml";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ guideId: string }>;
};

function formatGuideUpdatedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { guideId } = await params;
  const id = decodeURIComponent(guideId).trim();
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { title: "Guide | Ollie Code" };
  }
  const row = await fetchLearningGuideByIdForViewer(supabase, id);
  if (!row) {
    return { title: "Guide | Ollie Code" };
  }
  return {
    title: `${row.title} | Learning Hub`,
    description: "Learning guide on Ollie Code.",
  };
}

export default async function LearningGuidePage({ params }: Props) {
  const { guideId } = await params;
  const id = decodeURIComponent(guideId).trim();
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    notFound();
  }
  const row = await fetchLearningGuideByIdForViewer(supabase, id);
  if (!row) {
    notFound();
  }
  const bodyHtml = sanitizeLessonBodyHtml(row.body_html);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white text-[#111827]">
      <SignedInAppHeader active="learn" tone="learn" />
      <main className="min-w-0 flex-1">
        <div className="mx-auto min-w-0 max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-600">
              <li className="min-w-0">
                <Link
                  href="/learn"
                  className="font-semibold text-[#3f6212] no-underline transition hover:text-[#84c126] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
                >
                  Learning Hub
                </Link>
              </li>
              <li className="flex shrink-0 items-center" aria-hidden>
                <ChevronRight className="size-4 text-slate-300" strokeWidth={2} />
              </li>
              <li className="min-w-0">
                <Link
                  href="/learn?tab=guides"
                  className="font-semibold text-[#3f6212] no-underline transition hover:text-[#84c126] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
                >
                  Learning Guides
                </Link>
              </li>
              <li className="flex shrink-0 items-center" aria-hidden>
                <ChevronRight className="size-4 text-slate-300" strokeWidth={2} />
              </li>
              <li
                className="min-w-0 truncate font-medium text-slate-900"
                aria-current="page"
              >
                {row.title}
              </li>
            </ol>
          </nav>
          <header className="mt-5 border-b border-slate-200 pb-6 sm:mt-6">
            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {row.title}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Updated{" "}
              <time dateTime={row.updated_at}>{formatGuideUpdatedAt(row.updated_at)}</time>
            </p>
          </header>
          <div
            className="guide-modal-body mt-8"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
