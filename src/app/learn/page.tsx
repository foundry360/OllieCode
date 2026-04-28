import { Suspense } from "react";
import { SignedInAppHeader } from "@/components/app/SignedInAppHeader";
import { Footer } from "@/components/landing/Footer";
import { LearningHubExplore } from "@/components/lms/LearningHubExplore";
import { fetchPublishedLearningGuides } from "@/lib/lms/learningGuides";
import { getMergedPublishedLessonsForLearnHub } from "@/lib/lms/publishedLessons";
import { fetchFavoriteLessonIds } from "@/lib/supabase/lmsUserData";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function HubLoadingFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 text-center text-slate-600 sm:px-6">
      Loading Learning Hub…
    </div>
  );
}

export default async function LearnPage() {
  const lessons = await getMergedPublishedLessonsForLearnHub();

  const supabase = await createSupabaseServerClient();
  let favoriteLessonIds: string[] | undefined;
  const guides = await fetchPublishedLearningGuides(supabase);

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const ids = await fetchFavoriteLessonIds(supabase, user.id);
      favoriteLessonIds = [...ids];
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white text-[#111827]">
      <SignedInAppHeader active="learn" tone="learn" />
      <main className="min-w-0 flex-1">
        <Suspense fallback={<HubLoadingFallback />}>
          <LearningHubExplore
            lessons={lessons}
            guides={guides}
            favoriteLessonIds={favoriteLessonIds}
          />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
