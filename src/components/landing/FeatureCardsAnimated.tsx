"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export type FeatureCardItem = {
  title: string;
  body: string;
  icon: string;
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
      className="mt-10 grid gap-8 sm:grid-cols-3 lg:mt-12 lg:gap-10"
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
          <div className="ollie-feature-card flex h-full flex-col rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-7 text-center shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-[#84c126] sm:p-8">
            <div className="relative mx-auto mb-4 h-24 w-24 sm:h-28 sm:w-28">
              <Image src={item.icon} alt="" width={112} height={112} className="h-full w-full" />
            </div>
            <h3 className="font-section text-xl font-bold text-[#111827] sm:text-2xl">
              {item.title}
            </h3>
            <p className="mt-3 font-section text-sm leading-relaxed text-[#6b7280] sm:text-base">
              {item.body}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
