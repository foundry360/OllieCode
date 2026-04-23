"use client";

import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import { PlansPricingSection } from "@/components/plans/PlansPricingSection";
import { WorkspaceEmbeddedCheckout } from "@/components/plans/workspace-embedded-checkout";
import { subscriptionAllowsWorkspace } from "@/lib/billing/profileSubscription";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PlanCheckoutAvailability } from "@/lib/stripe/prices";

type GateState = "loading" | "entitled" | "paywall";

function PlansPricingFallback() {
  return (
    <div className="py-4 text-center text-xs text-[#6b7280]" aria-hidden>
      Loading plans…
    </div>
  );
}

type WorkspaceSubscriptionPaywallProps = {
  checkoutAvailability: PlanCheckoutAvailability;
  children: ReactNode;
};

export function WorkspaceSubscriptionPaywall({
  checkoutAvailability,
  children,
}: WorkspaceSubscriptionPaywallProps) {
  const router = useRouter();
  const [state, setState] = useState<GateState>("loading");
  const [embeddedClientSecret, setEmbeddedClientSecret] = useState<string | null>(null);

  const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";

  const loadAccess = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setState("entitled");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace(`/auth/login?next=${encodeURIComponent("/workspace")}`);
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("subscription_status,is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[workspace paywall] profile:", error.message);
      setState("paywall");
      return;
    }

    if (!profile) {
      setState("paywall");
      return;
    }

    if (profile.is_admin === true || subscriptionAllowsWorkspace(profile.subscription_status)) {
      setState("entitled");
      return;
    }

    setState("paywall");
  }, [router]);

  useEffect(() => {
    void loadAccess();
  }, [loadAccess]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void loadAccess();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [loadAccess]);

  /** After Embedded Checkout, Stripe redirects here with `session_id`; sync profile then strip query. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("stripe_checkout_return") !== "1") return;
    const sessionId = params.get("session_id");
    if (!sessionId?.startsWith("cs_")) return;

    const dedupeKey = `stripe_checkout_return_handled:${sessionId}`;
    if (sessionStorage.getItem(dedupeKey)) return;
    sessionStorage.setItem(dedupeKey, "1");

    setEmbeddedClientSecret(null);

    void (async () => {
      try {
        await fetch("/api/billing/confirm-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
      } catch {
        // confirm-session is best-effort; webhooks may still update profile
      } finally {
        router.replace("/workspace");
        await loadAccess();
      }
    })();
  }, [loadAccess, router]);

  const backToHome = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase?.auth.signOut();
    router.push("/");
    router.refresh();
  }, [router]);

  if (state === "entitled") {
    return <>{children}</>;
  }

  if (state === "loading") {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-[#111827]/80 px-6 text-center text-white"
        role="alertdialog"
        aria-busy="true"
        aria-label="Checking subscription"
      >
        <p className="text-base font-medium">Checking your plan…</p>
      </div>
    );
  }

  return (
    <>
      <div
        className="pointer-events-none select-none"
        aria-hidden
      >
        {children}
      </div>
      <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#0f172a]/45 p-2 backdrop-blur-[1px] sm:p-4">
        <div
          className="pointer-events-auto flex max-h-[100dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#e5e7eb]/90 bg-white/95 shadow-2xl backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="paywall-title"
        >
          <div className="shrink-0 border-b border-[#e5e7eb]/80 px-3 pb-3 pt-4 sm:px-5 sm:pb-4 sm:pt-5">
            <h1
              id="paywall-title"
              className="font-section text-center text-lg font-extrabold tracking-tight text-[#111827] sm:text-xl"
            >
              Which Plan Best Meets Your Needs?
            </h1>
            <p className="mx-auto mt-1.5 max-w-2xl text-center text-xs leading-snug text-[#6b7280] sm:text-sm">
              Pick a plan to unlock your workspace and start creating.
            </p>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-3 pb-3 pt-3 sm:px-5 sm:pb-4 sm:pt-4">
            {embeddedClientSecret && stripePublishableKey ? (
              <WorkspaceEmbeddedCheckout
                publishableKey={stripePublishableKey}
                clientSecret={embeddedClientSecret}
                onClose={() => setEmbeddedClientSecret(null)}
              />
            ) : (
              <>
                <Suspense fallback={<PlansPricingFallback />}>
                  <PlansPricingSection
                    checkoutAvailability={checkoutAvailability}
                    checkoutIntentBasePath="/workspace"
                    hideAccountAuthLinks
                    compact
                    checkoutUi="embedded"
                    onEmbeddedCheckoutClientSecret={setEmbeddedClientSecret}
                  />
                </Suspense>
                <p className="mx-auto mt-3 max-w-2xl shrink-0 px-1 pb-0.5 text-center text-[10px] leading-snug text-[#6b7280] sm:mt-4 sm:text-xs">
                  All payments are securely processed through a trusted, PCI-compliant provider.
                </p>
              </>
            )}
          </div>
          <div className="shrink-0 border-t border-[#e5e7eb] px-3 py-3 sm:px-5 sm:py-4">
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => void backToHome()}
                className="text-xs font-semibold text-[#4b5563] underline underline-offset-2 hover:text-[#111827] sm:text-sm"
              >
                Back to home
              </button>
              <p className="max-w-md text-center text-[10px] leading-tight text-[#9ca3af] sm:text-xs">
                Signs you out and returns to the home page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
