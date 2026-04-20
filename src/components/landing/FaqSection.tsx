"use client";

import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { useCallback, useState } from "react";

const FAQS: { id: string; question: string; answer: string }[] = [
  {
    id: "ages",
    question: "What ages is Ollie Code for?",
    answer:
      "Ollie Code is built for kids about 7–13. Younger learners can explore with a grown-up nearby; older tweens still enjoy the block-based workspace while leveling up their logic skills.",
  },
  {
    id: "typing",
    question: "Does my child need to know how to type?",
    answer:
      "No. Projects use drag-and-drop blocks, so kids focus on ideas and sequencing instead of spelling or syntax. Typing can come later when they’re ready.",
  },
  {
    id: "device",
    question: "What device or browser do we need?",
    answer:
      "A recent version of Chrome, Edge, Firefox, or Safari on a laptop, Chromebook, or desktop works best. A mouse or trackpad helps on the canvas; tablets can work but a larger screen is nicer for the block palette.",
  },
  {
    id: "account",
    question: "How do accounts and sign-in work?",
    answer:
      "Families or schools create an account so progress and projects can be saved. Your organization’s flow (for example, parent approval) may vary — follow the prompts on sign up.",
  },
  {
    id: "curriculum",
    question: "Is there a structured curriculum?",
    answer:
      "Yes. Learners can follow guided lessons and missions while still experimenting freely in the workspace. Staff and teachers can publish or assign content depending on your program setup.",
  },
  {
    id: "help",
    question: "Where can we get help?",
    answer:
      "Use the “Have a question?” button on this site to send us a note, or reach out through your school or program contact if you’re joining through an organization.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const toggle = useCallback((id: string) => {
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return (
    <section
      id="faq"
      className="relative scroll-mt-20 overflow-hidden px-4 py-16 sm:py-20 lg:py-24"
      aria-labelledby="faq-heading"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src="/images/cactus.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#ecfccb]/90 via-[#f7fee7]/55 to-[#d9f99d]/75"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-start">
          <div className="lg:sticky lg:top-28">
            <h2
              id="faq-heading"
              className="font-section text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl"
            >
              <span className="block text-[#111827]">Got Questions?</span>
              <span className="mt-1 block text-[#84c126] sm:mt-1.5">
                We&apos;ve Got Answers.
              </span>
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-[#6b7280] sm:text-lg">
              Quick answers for families and educators. Tap a question to open it — everything stays
              on one page so you can skim or dig in without losing your place.
            </p>
          </div>

          <div className="min-w-0">
            {FAQS.map((item) => {
              const isOpen = Boolean(open[item.id]);
              const panelId = `faq-panel-${item.id}`;
              const triggerId = `faq-trigger-${item.id}`;
              return (
                <div key={item.id} className="border-b border-[#84c126]/25">
                  <h3 className="text-base font-semibold text-[#111827] sm:text-lg">
                    <button
                      type="button"
                      id={triggerId}
                      className="flex w-full items-center justify-between gap-4 py-4 text-left transition hover:text-[#3f6212] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#84c126] sm:py-5"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => toggle(item.id)}
                    >
                      <span className="min-w-0 pr-2">{item.question}</span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-[#84c126] transition-transform duration-200 sm:h-6 sm:w-6 ${
                          isOpen ? "-rotate-180" : ""
                        }`}
                        aria-hidden
                      />
                    </button>
                  </h3>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={triggerId}
                    className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="max-w-xl pb-4 text-sm leading-relaxed text-[#6b7280] sm:text-base sm:leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
