import { SignedInAppHeader } from "@/components/app/SignedInAppHeader";
import { Footer } from "@/components/landing/Footer";
import { LearningHubExplore } from "@/components/lms/LearningHubExplore";
import { getMergedPublishedLessons } from "@/lib/lms/publishedLessons";
import { fetchFavoriteLessonIds } from "@/lib/supabase/lmsUserData";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LearnPage() {
  const lessons = await getMergedPublishedLessons();

  const supabase = await createSupabaseServerClient();
  let favoriteLessonIds: string[] | undefined;
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
      <div className="flex-1">
        <LearningHubExplore
          lessons={lessons}
          favoriteLessonIds={favoriteLessonIds}
        />
      </div>
      <Footer />
    </div>
  );
}
