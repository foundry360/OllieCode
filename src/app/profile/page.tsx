import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignedInAppHeader } from "@/components/app/SignedInAppHeader";
import { Footer } from "@/components/landing/Footer";
import { ProfileAdventureGrid } from "@/components/profile/ProfileAdventureGrid";
import { removeFavoriteLessonFormAction } from "@/app/profile/favorites-actions";
import {
  fetchLessonPointsTotal,
  fetchProfileAdventures,
  fetchProfileBadges,
  fetchProfileFavoriteLessons,
  fetchProfileIdentity,
} from "@/lib/supabase/lmsUserData";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-gradient-to-b from-slate-50 via-[#f3f7f0] to-[#e8f3dc] text-[#111827]">
        <SignedInAppHeader active="profile" />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
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
        <Footer />
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/profile");
  }

  const [adventures, points, badges, identity, favoriteLessons] =
    await Promise.all([
      fetchProfileAdventures(supabase, user.id),
      fetchLessonPointsTotal(supabase, user.id),
      fetchProfileBadges(supabase, user.id),
      fetchProfileIdentity(supabase, user.id, user.email),
      fetchProfileFavoriteLessons(supabase, user.id),
    ]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gradient-to-b from-slate-50 via-[#f3f7f0] to-[#e8f3dc] text-[#111827]">
      <SignedInAppHeader active="profile" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <header>
          <h1 className="font-display text-3xl font-bold">Your profile</h1>
          <p className="mt-1 text-[#6b7280]">
            Progress from lessons and adventures you save.
          </p>
        </header>

        <section
          className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:gap-8"
          aria-label="Your learner identity"
        >
          {identity.avatarImageSrc ? (
            <div className="relative size-28 shrink-0 overflow-hidden rounded-full border-2 border-[#e5e7eb] bg-[#f9fafb] sm:size-32">
              <Image
                src={identity.avatarImageSrc}
                alt=""
                width={128}
                height={128}
                className="h-full w-full object-cover object-top"
              />
            </div>
          ) : (
            <div
              className="flex size-28 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-[#d1d5db] bg-[#f3f4f6] text-3xl font-bold text-[#9ca3af] sm:size-32 sm:text-4xl"
              aria-hidden
            >
              {(identity.codename || "?").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
              Codename
            </p>
            <p className="font-display mt-1 text-2xl font-bold text-[#111827] sm:text-3xl">
              {identity.codename}
            </p>
            <p className="mt-3 inline-flex items-center rounded-full bg-[#ecfccb] px-3 py-1 text-sm font-semibold text-[#3f6212] ring-1 ring-[#84c126]/30">
              Level {identity.skillLevel} · {identity.levelLabel}
            </p>
          </div>
        </section>

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
            <p className="text-sm font-semibold text-[#6b7280]">My Adventures</p>
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
              first badge.
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

        <section className="mt-10" aria-labelledby="my-adventures-heading">
          <h2
            id="my-adventures-heading"
            className="font-display text-xl font-bold text-[#111827]"
          >
            My Adventures
          </h2>
          {adventures.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-[#d1d5db] bg-white px-4 py-6 text-sm text-[#6b7280]">
              When you save an adventure in the workspace, it appears here.
            </p>
          ) : (
            <ProfileAdventureGrid adventures={adventures} userId={user.id} />
          )}
        </section>

        <section className="mt-10" aria-labelledby="fav-lessons-heading">
          <h2
            id="fav-lessons-heading"
            className="font-display text-xl font-bold text-[#111827]"
          >
            Favorite Lessons
          </h2>
          {favoriteLessons.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-[#d1d5db] bg-white px-4 py-6 text-sm text-[#6b7280]">
              Star lessons in the{" "}
              <Link href="/learn" className="font-semibold text-[#84c126] hover:underline">
                Learning Hub
              </Link>{" "}
              to save them here.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-[#e5e7eb] rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
              {favoriteLessons.map((l) => (
                <li
                  key={l.lessonId}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <Link
                    href={l.href}
                    className="min-w-0 flex-1 font-display font-semibold text-[#84c126] no-underline hover:text-[#6b9e1f] hover:underline"
                  >
                    {l.title}
                  </Link>
                  <form action={removeFavoriteLessonFormAction}>
                    <input type="hidden" name="lessonId" value={l.lessonId} />
                    <button
                      type="submit"
                      className="text-sm font-medium text-[#9ca3af] transition hover:text-[#b91c1c]"
                    >
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
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
      <Footer />
    </div>
  );
}
