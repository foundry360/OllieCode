import Link from "next/link";
import { ImageIcon } from "lucide-react";
import {
  lessonDetailHref,
  lessonHeroImageUrl,
  type LessonCatalogEntry,
} from "@/lib/lms/lessonsCatalog";

type Props = {
  lessons: LessonCatalogEntry[];
};

export function DiscoverMoreSection({ lessons }: Props) {
  if (lessons.length === 0) return null;

  return (
    <section
      className="mt-14 border-t border-slate-200 pt-12"
      aria-labelledby="learn-more-heading"
    >
      <h2
        id="learn-more-heading"
        className="font-display text-2xl font-bold text-slate-900 md:text-3xl"
      >
        Learn More
      </h2>
      <p className="mt-3 max-w-3xl text-lg leading-relaxed text-slate-600 md:text-xl">
        Try more Ollie Code adventures to learn new things and create more fun
        projects!
      </p>

      <ul className="mt-8 grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 lg:grid-cols-4">
        {lessons.map((lesson) => (
          <li key={lesson.id}>
            <DiscoverMoreCard lesson={lesson} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function DiscoverMoreCard({ lesson }: { lesson: LessonCatalogEntry }) {
  const hero = lessonHeroImageUrl(lesson);
  const href = lessonDetailHref(lesson.id);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <Link
        href={href}
        className="relative block aspect-[16/10] shrink-0 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200"
      >
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element -- lesson URLs may be any host
          <img
            src={hero}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full min-h-[120px] items-center justify-center">
            <ImageIcon
              className="size-12 text-slate-300/90"
              strokeWidth={1.25}
              aria-hidden
            />
          </span>
        )}
      </Link>
      <div className="border-t border-slate-100 p-4">
        <h3 className="font-display text-base font-bold capitalize leading-snug text-slate-900">
          <Link
            href={href}
            className="text-[#84c126] no-underline hover:text-[#6b9e1f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
          >
            {lesson.title}
          </Link>
        </h3>
      </div>
    </article>
  );
}
