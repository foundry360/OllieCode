import { SignedInAppHeader } from "@/components/app/SignedInAppHeader";
import { Footer } from "@/components/landing/Footer";
import { LearningHubExplore } from "@/components/lms/LearningHubExplore";
import { getMergedPublishedLessons } from "@/lib/lms/publishedLessons";

export default async function LearnPage() {
  const lessons = await getMergedPublishedLessons();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white text-[#111827]">
      <SignedInAppHeader active="learn" tone="learn" />
      <div className="flex-1">
        <LearningHubExplore lessons={lessons} />
      </div>
      <Footer />
    </div>
  );
}
