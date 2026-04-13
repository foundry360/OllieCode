import Link from "next/link";
import { redirect } from "next/navigation";
import { SignedInAppHeader } from "@/components/app/SignedInAppHeader";
import { ProfileAdventureGrid } from "@/components/profile/ProfileAdventureGrid";
import {
  fetchLessonPointsTotal,
  fetchProfileAdventures,
  fetchProfileBadges,
} from "@/lib/supabase/lmsUserData";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return (
      <div className="min-h-[100dvh] bg-[#f8fafc] text-[#111827]">
        <SignedInAppHeader active="profile" />
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <h1 className="font-display text-2xl font-bold">Profile</h1>
          <p className="mt-2 max-w-lg text-sm text-[#6b7280]">
            Add Supabase environment variables to load your account profile,
            points, and badges.
          </p>
          <Link
            href="/workspace"
            className="mt-6 inline-block font-semibold text-[#84c126] hover:underline"
          >
            Go to workspace
          </Link>
        </main>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/profile");
  }

  const [adventures, points, badges] = await Promise.all([
    fetchProfileAdventures(supabase, user.id),
    fetchLessonPointsTotal(supabase, user.id),
    fetchProfileBadges(supabase, user.id),
  ]);

  return (
    <div className="min-h-[100dvh] bg-[#f8fafc] text-[#111827]">
      <SignedInAppHeader active="profile" />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <header>
          <h1 className="font-display text-3xl font-bold">Your profile</h1>
          <p className="mt-1 text-[#6b7280]">
            Progress from lessons and adventures you save while signed in.
          </p>
        </header>

        <section
          className="mt-8 grid gap-4 sm:grid-cols-3"
          aria-label="Summary"
        >
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#6b7280]">Points</p>
            <p className="font-display mt-1 text-3xl font-bold tabular-nums text-[#111827]">
              {points}
            </p>
            <p className="mt-2 text-xs text-[#9ca3af]">
              Earned from completed lessons
            </p>
          </div>
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#6b7280]">Badges</p>
            <p className="font-display mt-1 text-3xl font-bold tabular-nums text-[#111827]">
              {badges.length}
            </p>
            <p className="mt-2 text-xs text-[#9ca3af]">Unlocked achievements</p>
          </div>
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#6b7280]">Adventures</p>
            <p className="font-display mt-1 text-3xl font-bold tabular-nums text-[#111827]">
              {adventures.length}
            </p>
            <p className="mt-2 text-xs text-[#9ca3af]">Saved in your account</p>
          </div>
        </section>

        <section className="mt-10" aria-labelledby="badges-heading">
          <h2
            id="badges-heading"
            className="font-display text-xl font-bold text-[#111827]"
          >
            Badges
          </h2>
          {badges.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-[#d1d5db] bg-white px-4 py-6 text-sm text-[#6b7280]">
              No badges yet. Finish Level 1 lessons and adventures to earn your
              first ones.
            </p>
          ) : (
            <ul className="mt-4 flex flex-wrap gap-3">
              {badges.map((b) => (
                <li
                  key={b.slug}
                  className="flex max-w-sm items-start gap-3 rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm"
                >
                  <span className="text-2xl" aria-hidden>
                    {b.icon_emoji}
                  </span>
                  <div>
                    <p className="font-display font-bold text-[#111827]">
                      {b.title}
                    </p>
                    <p className="mt-0.5 text-sm text-[#6b7280]">
                      {b.description}
                    </p>
                    <p className="mt-2 text-xs text-[#9ca3af]">
                      Earned{" "}
                      {new Date(b.earned_at).toLocaleDateString(undefined, {
                        dateStyle: "medium",
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10" aria-labelledby="adventures-heading">
          <h2
            id="adventures-heading"
            className="font-display text-xl font-bold text-[#111827]"
          >
            Adventures
          </h2>
          {adventures.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-[#d1d5db] bg-white px-4 py-6 text-sm text-[#6b7280]">
              When you save an adventure in the workspace, it appears here.
            </p>
          ) : (
            <ProfileAdventureGrid adventures={adventures} />
          )}
        </section>

        <p className="mt-10 text-center text-sm text-[#9ca3af]">
          Tip: open{" "}
          <Link href="/learn" className="font-semibold text-[#84c126] hover:underline">
            Learning Hub
          </Link>{" "}
          to start Level 1 activities.
        </p>
      </main>
    </div>
  );
}
