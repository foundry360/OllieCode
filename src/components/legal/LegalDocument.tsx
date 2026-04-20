import type { ReactNode } from "react";

type LegalDocumentProps = {
  title: string;
  lastUpdated: string;
  children: ReactNode;
};

export function LegalDocument({ title, lastUpdated, children }: LegalDocumentProps) {
  return (
    <main className="flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <article className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#111827] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-[#6b7280]">Last updated: {lastUpdated}</p>
        <div className="mt-10 space-y-8 text-sm leading-relaxed text-[#374151] sm:text-base sm:leading-relaxed">
          {children}
        </div>
      </article>
    </main>
  );
}

export function LegalSection({
  id,
  heading,
  children,
}: {
  id?: string;
  heading: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-display text-lg font-bold text-[#111827] sm:text-xl">{heading}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
