import type { PaidPlanId } from "@/lib/stripe/prices";

export type PlanCardId = PaidPlanId | "educators";

export type PlanCardCta =
  | { kind: "signup"; label: string }
  | { kind: "educatorsContact"; label: string };

export type PlanCardAccent = {
  headerTop: string;
  iconFrame: string;
  title: string;
};

export type PlanCardDefinition = {
  id: PlanCardId;
  name: string;
  positioning: string | null;
  audience: string | null;
  /** When set, price line follows the billing toggle (home plans). */
  pricingByBilling: { month: string; year: string } | null;
  /** Fixed price line (e.g. Educators). */
  pricingStatic: string | null;
  pricingLead: string | null;
  features: readonly string[];
  description: string | null;
  iconSrc: string;
  iconAlt: string;
  cta: PlanCardCta;
  accent: PlanCardAccent;
};

export const PLAN_CARDS: readonly PlanCardDefinition[] = [
  {
    id: "starter",
    name: "Starter Plan",
    positioning: "Perfect For Getting Started",
    audience: "For one creator",
    pricingByBilling: { month: "$7/month", year: "$75/year" },
    pricingStatic: null,
    features: [
      "1 child account",
      "Full access to all lessons and projects",
      "Unlimited builds and saves",
      "Game creation + project tools",
      "Individual progress tracking",
    ],
    pricingLead: null,
    description: null,
    iconSrc: "/images/plan-icon-starter.png",
    iconAlt:
      "Friendly red robot character with a star, representing the Starter plan.",
    cta: { kind: "signup", label: "Get Started" },
    accent: {
      headerTop: "bg-rose-100 border-b border-rose-200/50",
      iconFrame:
        "rounded-full border-4 border-rose-300 bg-rose-50 p-1 shadow-md ring-2 ring-white sm:p-1.5",
      title: "text-rose-950",
    },
  },
  {
    id: "family",
    name: "Family Plan",
    positioning: "Siblings & Shared Learning",
    audience: "For growing creators",
    pricingByBilling: { month: "$12/month", year: "$130/year" },
    pricingStatic: null,
    features: [
      "Up to 3 child accounts",
      "Full access to all lessons and projects",
      "Unlimited builds and saves",
      "Game creation + project tools",
      "Individual progress tracking",
    ],
    pricingLead: null,
    description: null,
    iconSrc: "/images/plan-icon-homeschool.png",
    iconAlt:
      "Friendly orange robot in a graduation cap holding a book, representing the Family plan.",
    cta: { kind: "signup", label: "Get Started" },
    accent: {
      headerTop: "bg-amber-100 border-b border-amber-200/50",
      iconFrame:
        "rounded-full border-4 border-amber-300 bg-amber-50 p-1 shadow-md ring-2 ring-white sm:p-1.5",
      title: "text-amber-950",
    },
  },
  {
    id: "educators",
    name: "Educators",
    positioning: "Schools, Studios & Programs",
    audience: "For schools and programs",
    pricingByBilling: null,
    pricingStatic: "Custom Plan",
    features: [
      "Unlimited student accounts",
      "Classroom dashboard",
      "Assignment & lesson controls",
      "Professional Development",
      "Bulk pricing for schools & districts",
    ],
    pricingLead: null,
    description: null,
    iconSrc: "/images/plan-icon-educators.png",
    iconAlt:
      "Friendly blue robot with glasses and a wand, representing the Educators plan.",
    cta: { kind: "educatorsContact", label: "Contact Us" },
    accent: {
      headerTop: "bg-sky-100 border-b border-sky-200/50",
      iconFrame:
        "rounded-full border-4 border-sky-300 bg-sky-50 p-1 shadow-md ring-2 ring-white sm:p-1.5",
      title: "text-sky-950",
    },
  },
] as const;
