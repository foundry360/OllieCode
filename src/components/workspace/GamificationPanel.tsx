"use client";

/**
 * Badges / levels — placeholder UI. Wire to Supabase profiles or a `user_progress` table later.
 * Optional: animate badge unlocks with GSAP (import gsap from 'gsap'; gsap.from('.badge', { scale: 0, ease: 'back.out' })).
 */
const BADGES = ["Starter", "Coder", "Game Builder", "AI Explorer"];

export function GamificationPanel() {
  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-base font-bold text-[#111827]">Your progress</h3>
        <span className="rounded-full bg-[#84c126]/15 px-2 py-0.5 text-xs font-bold text-[#3f6212]">
          Level 1
        </span>
      </div>
      <p className="mt-1 text-sm text-[#6b7280]">
        Earn badges as you finish missions (coming soon).
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {BADGES.map((b) => (
          <li
            key={b}
            className="badge rounded-full border border-dashed border-[#d1d5db] bg-[#f9fafb] px-3 py-1 text-xs font-semibold text-[#6b7280]"
          >
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}
