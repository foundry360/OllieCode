"use client";

import { useEffect, useState, useTransition } from "react";
import { Star } from "lucide-react";
import { toggleLessonFavorite } from "@/app/profile/favorites-actions";

type Props = {
  lessonId: string;
  initialFavorited: boolean;
};

export function LessonFavoriteStarButton({
  lessonId,
  initialFavorited,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [on, setOn] = useState(initialFavorited);

  useEffect(() => {
    setOn(initialFavorited);
  }, [initialFavorited]);

  return (
    <button
      type="button"
      disabled={pending}
      title={on ? "Remove from favorites" : "Add to favorites"}
      aria-label={
        on ? "Remove lesson from favorites" : "Add lesson to favorites"
      }
      aria-pressed={on}
      className={`rounded p-1.5 transition ${
        on
          ? "text-amber-500 hover:bg-amber-500/10"
          : "text-slate-400 hover:bg-slate-100 hover:text-amber-500"
      } disabled:opacity-50`}
      onClick={() => {
        const next = !on;
        setOn(next);
        startTransition(async () => {
          const { ok } = await toggleLessonFavorite(lessonId, next);
          if (!ok) setOn(!next);
        });
      }}
    >
      <Star
        className="size-4"
        strokeWidth={2}
        fill={on ? "currentColor" : "none"}
      />
    </button>
  );
}
