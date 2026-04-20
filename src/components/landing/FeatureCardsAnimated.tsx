"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export type FeatureCardItem = {
  title: string;
  body: string;
  icon: string;
  /** Intrinsic size for `next/image` (use real file dimensions for PNGs). */
  iconWidth?: number;
  iconHeight?: number;
  /** Extra classes on the icon container (e.g. border to match another card’s artwork). */
  iconWrapperClassName?: string;
};

type FeatureCardsAnimatedProps = {
  items: FeatureCardItem[];
};

export function FeatureCardsAnimated({ items }: FeatureCardsAnimatedProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setVisible(true);
      return;
    }

    const el = listRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.06, rootMargin: "0px 0px 12% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <ul
      ref={listRef}
      className="mt-8 grid gap-6 sm:grid-cols-3 lg:mt-10 lg:gap-8"
    >
      {items.map((item, index) => (
        <li
          key={item.title}
          className={[
            "transition-[transform,opacity] duration-700 ease-out motion-reduce:transition-none",
            reducedMotion || visible
              ? "translate-y-0 opacity-100"
              : "translate-y-14 opacity-0",
          ].join(" ")}
          style={
            reducedMotion
              ? undefined
              : { transitionDelay: visible ? `${index * 110}ms` : "0ms" }
          }
        >
          <div className="ollie-feature-card flex h-full flex-col rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-5 text-center shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-[#84c126] sm:p-6">
            <div
              className={[
                /* Fixed square matches Build Games on-screen footprint; all cards share it. */
                "relative mx-auto mb-3 flex h-24 w-24 shrink-0 items-center justify-center sm:h-28 sm:w-28",
                item.iconWrapperClassName ?? "",
              ].join(" ")}
            >
              <Image
                src={item.icon}
                alt=""
                width={item.iconWidth ?? 80}
                height={item.iconHeight ?? 80}
                sizes="(max-width: 640px) 96px, 112px"
                className="max-h-full max-w-full object-contain object-center"
              />
            </div>
            <h3 className="font-section text-lg font-bold text-[#111827] sm:text-xl">
              {item.title}
            </h3>
            <p className="mt-2 font-section text-xs leading-relaxed text-[#6b7280] sm:text-sm">
              {item.body}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
