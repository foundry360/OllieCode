"use client";

import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import { PlansPricingSection } from "@/components/plans/PlansPricingSection";
import { WorkspacePlanCheckoutForm } from "@/components/plans/workspace-plan-checkout-form";
import type { PlanInlineCheckoutPayload } from "@/components/plans/PlanPaidCheckoutCtas";
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
  const [inlineCheckout, setInlineCheckout] = useState<PlanInlineCheckoutPayload | null>(null);

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

    let { data: profile, error } = await supabase
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
      try {
        const ensureRes = await fetch("/api/profile/ensure", { method: "POST" });
        if (ensureRes.ok) {
          const retry = await supabase
            .from("profiles")
            .select("subscription_status,is_admin")
            .eq("id", user.id)
            .maybeSingle();
          profile = retry.data;
          error = retry.error;
        }
      } catch {
        /* ignore */
      }
    }

    if (error || !profile) {
      if (!profile) {
        console.error("[workspace paywall] profile: missing row after ensure");
      }
      setState("paywall");
      return;
    }

    if (profile.is_admin === true || subscriptionAllowsWorkspace(profile.subscription_status)) {
      setState("entitled");
      return;
    }

    // Reconcile with Stripe when DB is behind (missed webhook, confirm-session failure, etc.).
    try {
      const syncRes = await fetch("/api/billing/sync-from-stripe", { method: "POST" });
      if (syncRes.ok) {
        const syncBody = (await syncRes.json().catch(() => ({}))) as { updated?: boolean };
        if (syncBody.updated) {
          const { data: again, error: againErr } = await supabase
            .from("profiles")
            .select("subscription_status,is_admin")
            .eq("id", user.id)
            .maybeSingle();

          if (!againErr && again) {
            if (again.is_admin === true || subscriptionAllowsWorkspace(again.subscription_status)) {
              setState("entitled");
              return;
            }
          }
        }
      }
    } catch {
      /* ignore */
    }

    setState("paywall");
  }, [router]);

  useEffect(() => {
    void (async () => {
      let syncedFromWelcome = false;
      if (typeof window !== "undefined") {
        const sid = sessionStorage.getItem("ollie_post_checkout_session");
        if (sid?.startsWith("cs_")) {
          try {
            const res = await fetch("/api/billing/confirm-session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ session_id: sid }),
            });
            if (res.ok) {
              sessionStorage.removeItem("ollie_post_checkout_session");
              syncedFromWelcome = true;
            }
          } catch {
            // Best-effort; webhooks may still update profile.
          }
        }
      }
      await loadAccess();
      if (syncedFromWelcome) {
        router.refresh();
      }
    })();
  }, [loadAccess, router]);

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

    setInlineCheckout(null);

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
        router.replace(`/workspace/welcome?session_id=${encodeURIComponent(sessionId)}`);
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

  const showingStripeCheckout = Boolean(inlineCheckout && stripePublishableKey);

  if (state === "entitled") {
    return <>{children}</>;
  }

  if (state === "loading") {
    return (
      <div
        className="fixed inset-0 z-[110000] flex items-center justify-center bg-[#111827]/80 px-6 text-center text-white"
        role="alertdialog"
        aria-busy="true"
        aria-label="Hang tight"
      >
        <p className="text-base font-medium">Hang tight…</p>
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
      <div className="fixed inset-0 z-[110000] flex items-center justify-center overflow-hidden bg-[#0f172a]/45 p-4 backdrop-blur-[1px] sm:p-6">
        <div
          className={`pointer-events-auto flex w-full flex-col overflow-hidden rounded-2xl border bg-white/95 shadow-2xl backdrop-blur-sm ${showingStripeCheckout ? "max-h-[min(92dvh,900px)] max-w-[min(98vw,72rem)] border-[#cfe8b8] shadow-[0_25px_50px_-12px_rgba(132,193,38,0.18)]" : "max-h-[min(76dvh,680px)] max-w-[min(96vw,52rem)] border-[#e5e7eb]/90"}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="paywall-title"
        >
          <div
            className={`shrink-0 border-b ${showingStripeCheckout ? "px-4 pb-4 pt-4 sm:px-7 sm:pb-5 sm:pt-5" : "px-4 pb-3 pt-3.5 sm:px-6 sm:pb-4 sm:pt-4"} ${showingStripeCheckout ? "border-[#e5e7eb]/80 bg-[linear-gradient(180deg,#f7fcf2_0%,#ffffff_100%)]" : "border-[#e5e7eb]/80"}`}
          >
            <h1
              id="paywall-title"
              className="font-section text-center text-base font-extrabold tracking-tight text-[#111827] sm:text-lg"
            >
              {showingStripeCheckout ? "You're One Step Away" : "Which Plan Best Meets Your Needs?"}
            </h1>
            <p className="mx-auto mt-1 max-w-2xl text-center text-[11px] leading-snug text-[#6b7280] sm:text-xs">
              {showingStripeCheckout
                ? "Add your payment details to complete setup. Secure processing and you can update or cancel anytime."
                : "Pick a plan to unlock your workspace and start creating."}
            </p>
          </div>
          <div
            className={`flex min-h-0 flex-1 flex-col ${showingStripeCheckout ? "px-4 pb-5 pt-3 sm:px-7 sm:pb-6 sm:pt-5" : "px-4 pb-3 pt-3 sm:px-6 sm:pb-4 sm:pt-4"} ${showingStripeCheckout ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden"}`}
          >
            {showingStripeCheckout && inlineCheckout ? (
              <WorkspacePlanCheckoutForm
                key={inlineCheckout.clientSecret}
                publishableKey={stripePublishableKey}
                clientSecret={inlineCheckout.clientSecret}
                plan={inlineCheckout.plan}
                billing={inlineCheckout.billing}
                onClose={() => setInlineCheckout(null)}
              />
            ) : (
              <>
                <Suspense fallback={<PlansPricingFallback />}>
                  <PlansPricingSection
                    checkoutAvailability={checkoutAvailability}
                    checkoutIntentBasePath="/workspace"
                    hideAccountAuthLinks
                    compact
                    checkoutUi="elements"
                    onEmbeddedCheckoutClientSecret={setInlineCheckout}
                  />
                </Suspense>
                <p className="mx-auto mt-3 max-w-2xl shrink-0 px-1 pb-0.5 text-center text-[10px] leading-snug text-[#6b7280] sm:mt-4 sm:text-xs">
                  All payments are securely processed through a trusted, PCI-compliant provider.
                </p>
              </>
            )}
          </div>
          {showingStripeCheckout ? null : (
            <div className="shrink-0 border-t border-[#e5e7eb] px-4 py-4 sm:px-6 sm:py-5">
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
          )}
        </div>
      </div>
    </>
  );
}
