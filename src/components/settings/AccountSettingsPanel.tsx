"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  ExternalLink,
  LifeBuoy,
  Shield,
  UserRound,
  Users,
  X,
} from "lucide-react";
import type { AccountBillingSummary } from "@/lib/billing/accountBilling";
import { authEmailLocalPart } from "@/lib/auth/authEmailDomain";
import { PLAN_CARDS } from "@/lib/plans/planCards";
import { OLLIE_AVATARS, isOllieAvatarSlug, type OllieAvatarId } from "@/lib/profiles/avatarAssets";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type AccountSettingsTabId =
  | "plan-billing"
  | "family"
  | "profile"
  | "login-security"
  | "support-privacy";

type AccountProfileState = {
  codename: string;
  email: string | null;
  avatarSlug: OllieAvatarId | null;
  subscriptionStatus: string | null;
};

type AccountSettingsPanelProps = {
  activeTab: AccountSettingsTabId;
  onTabChange: (tab: AccountSettingsTabId) => void;
  onClose?: () => void;
  portalReturnPath: string;
  onAvatarSaved?: (id: OllieAvatarId) => void;
};

const TAB_ITEMS: {
  id: AccountSettingsTabId;
  label: string;
  Icon: typeof CreditCard;
}[] = [
  { id: "plan-billing", label: "Plan & Billing", Icon: CreditCard },
  { id: "family", label: "Family", Icon: Users },
  { id: "profile", label: "Profile", Icon: UserRound },
  { id: "login-security", label: "Login & Security", Icon: Shield },
  { id: "support-privacy", label: "Support & Privacy", Icon: LifeBuoy },
];

export function parseAccountSettingsTab(
  raw: string | null | undefined,
): AccountSettingsTabId | null {
  return TAB_ITEMS.find((item) => item.id === raw)?.id ?? null;
}

export function normalizeAccountSettingsTab(raw: string | null | undefined): AccountSettingsTabId {
  return parseAccountSettingsTab(raw) ?? "plan-billing";
}

function formatSubscriptionStatus(status: string | null | undefined): string {
  const value = status?.trim();
  if (!value) return "No active subscription";
  return value
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatSubscriptionStatusMessage(status: string | null | undefined): string {
  const value = status?.trim();
  if (!value) {
    return "Your account does not currently have an active paid subscription.";
  }

  if (value === "active") {
    return "Your account is currently active.";
  }
  if (value === "trialing") {
    return "Your account is currently in a trial period.";
  }
  if (value === "past_due") {
    return "Your account is currently past due.";
  }
  if (value === "canceled") {
    return "Your account is currently canceled.";
  }
  if (value === "unpaid") {
    return "Your account is currently unpaid.";
  }
  if (value === "incomplete") {
    return "Your account setup is currently incomplete.";
  }
  if (value === "incomplete_expired") {
    return "Your account setup expired before it was completed.";
  }
  if (value === "paused") {
    return "Your account is currently paused.";
  }

  return `Your account is currently ${formatSubscriptionStatus(value).toLowerCase()}.`;
}

function formatPlanLabel(plan: AccountBillingSummary["plan"]): string {
  if (plan === "family") return "Family";
  if (plan === "starter") return "Starter";
  return "No paid plan";
}

function formatBillingLabel(billing: AccountBillingSummary["billing"]): string {
  if (billing === "year") return "Yearly";
  if (billing === "month") return "Monthly";
  return "Not set";
}

function formatPlanPrice(
  plan: AccountBillingSummary["plan"],
  billing: AccountBillingSummary["billing"],
): string | null {
  if (!plan || !billing) return null;
  const card = PLAN_CARDS.find((entry) => entry.id === plan);
  return card?.pricingByBilling?.[billing] ?? null;
}

/** Catalog price or Stripe preview total (reflects coupons, e.g. $0/month). */
function planPriceLineForSettings(billing: AccountBillingSummary | null): string | null {
  if (!billing) return null;
  if (billing.recurringPriceDisplay) return billing.recurringPriceDisplay;
  return formatPlanPrice(billing.plan, billing.billing);
}

function formatDateLabel(value: string | null): string {
  if (!value) return "No renewal date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No renewal date";
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}

function PanelCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm sm:p-5">
      <h3 className="text-sm font-bold text-[#111827] sm:text-base">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function AccountSettingsPanel({
  activeTab,
  onTabChange,
  onClose,
  portalReturnPath,
  onAvatarSaved,
}: AccountSettingsPanelProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<AccountProfileState | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [billing, setBilling] = useState<AccountBillingSummary | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalMessage, setPortalMessage] = useState<string | null>(null);

  type FamilyRosterMember = { userId: string; username: string | null; isMaster: boolean };
  const [familyRoster, setFamilyRoster] = useState<FamilyRosterMember[]>([]);
  const [familyRosterLoading, setFamilyRosterLoading] = useState(false);
  const [familyRosterError, setFamilyRosterError] = useState<string | null>(null);
  const [siblingUsername, setSiblingUsername] = useState("");
  const [siblingPassword, setSiblingPassword] = useState("");
  const [siblingBirthDate, setSiblingBirthDate] = useState("");
  const [addSiblingLoading, setAddSiblingLoading] = useState(false);
  const [addSiblingMessage, setAddSiblingMessage] = useState<string | null>(null);

  const refreshAccount = useCallback(async () => {
    setAccountLoading(true);
    setBillingLoading(true);
    setAccountError(null);
    setBillingError(null);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setProfile(null);
      setBilling(null);
      setAccountError("Supabase is not configured for account settings.");
      setBillingError("Billing is not available until Supabase is configured.");
      setAccountLoading(false);
      setBillingLoading(false);
      return;
    }

    try {
      await fetch("/api/profile/ensure", { method: "POST" }).catch(() => undefined);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setProfile(null);
        setBilling(null);
        setAccountError("Sign in to manage your account settings.");
        setBillingError("Sign in to load billing details.");
        return;
      }

      const { data: profileRow, error: profileErr } = await supabase
        .from("profiles")
        .select("username,avatar_slug,subscription_status")
        .eq("id", user.id)
        .maybeSingle();

      if (profileErr) {
        setAccountError(profileErr.message);
      }

      const rawAvatar = profileRow?.avatar_slug;
      setProfile({
        codename: profileRow?.username?.trim() || authEmailLocalPart(user.email),
        email: user.email ?? null,
        avatarSlug: isOllieAvatarSlug(rawAvatar) ? rawAvatar : null,
        subscriptionStatus:
          typeof profileRow?.subscription_status === "string"
            ? profileRow.subscription_status
            : null,
      });

      const billingRes = await fetch("/api/billing/summary", { cache: "no-store" });
      const billingBody = (await billingRes.json().catch(() => ({}))) as
        | AccountBillingSummary
        | { error?: string };
      if (!billingRes.ok) {
        const billingErrorMessage =
          "error" in billingBody && typeof billingBody.error === "string"
            ? billingBody.error
            : "Could not load billing details.";
        setBilling(null);
        setBillingError(billingErrorMessage);
      } else {
        setBilling(billingBody as AccountBillingSummary);
      }
    } finally {
      setAccountLoading(false);
      setBillingLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (cancelled) return;
      await refreshAccount();
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshAccount]);

  useEffect(() => {
    if (activeTab !== "family" || accountLoading) return;
    let cancelled = false;
    void (async () => {
      setFamilyRosterLoading(true);
      setFamilyRosterError(null);
      try {
        const res = await fetch("/api/family/roster", { cache: "no-store" });
        const body = (await res.json()) as { members?: FamilyRosterMember[]; error?: string };
        if (!res.ok) {
          if (!cancelled) {
            setFamilyRosterError(body.error ?? "Could not load family roster.");
          }
          return;
        }
        if (!cancelled) setFamilyRoster(body.members ?? []);
      } catch {
        if (!cancelled) setFamilyRosterError("Could not load family roster.");
      } finally {
        if (!cancelled) setFamilyRosterLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, accountLoading]);

  const submitAddSibling = useCallback(async () => {
    setAddSiblingLoading(true);
    setAddSiblingMessage(null);
    try {
      const res = await fetch("/api/family/add-sibling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: siblingUsername.trim(),
          password: siblingPassword,
          birth_date: siblingBirthDate.trim() || undefined,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setAddSiblingMessage(body.error ?? "Could not add sibling.");
        return;
      }
      setSiblingUsername("");
      setSiblingPassword("");
      setSiblingBirthDate("");
      setAddSiblingMessage("Sibling account created. They can sign in with their new codename.");
      await refreshAccount();
      const rosterRes = await fetch("/api/family/roster", { cache: "no-store" });
      if (rosterRes.ok) {
        const rosterBody = (await rosterRes.json()) as { members?: FamilyRosterMember[] };
        setFamilyRoster(rosterBody.members ?? []);
      }
    } catch {
      setAddSiblingMessage("Something went wrong. Try again.");
    } finally {
      setAddSiblingLoading(false);
    }
  }, [refreshAccount, siblingBirthDate, siblingPassword, siblingUsername]);

  const saveAvatar = useCallback(
    async (avatarId: OllieAvatarId) => {
      setAvatarSaving(true);
      setAvatarMessage(null);
      try {
        const response = await fetch("/api/profile/avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatarSlug: avatarId }),
        });
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        if (!response.ok) {
          setAvatarMessage(body.error || "Could not update avatar.");
          return;
        }

        setProfile((current) =>
          current ? { ...current, avatarSlug: avatarId } : current,
        );
        onAvatarSaved?.(avatarId);
        setAvatarMessage("Avatar updated.");
      } finally {
        setAvatarSaving(false);
      }
    },
    [onAvatarSaved],
  );

  const openBillingPortal = useCallback(async () => {
    setPortalLoading(true);
    setPortalMessage(null);
    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnPath: portalReturnPath }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !body.url) {
        setPortalMessage(body.error || "Could not open billing management.");
        return;
      }
      window.location.href = body.url;
    } finally {
      setPortalLoading(false);
    }
  }, [portalReturnPath]);

  const updatePassword = useCallback(async () => {
    setPasswordMessage(null);
    if (password.length < 6) {
      setPasswordMessage("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordMessage("Passwords do not match.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setPasswordMessage("Supabase is not configured.");
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setPasswordMessage(error.message);
        return;
      }
      setPassword("");
      setConfirmPassword("");
      setPasswordMessage("Password updated.");
    } finally {
      setPasswordLoading(false);
    }
  }, [confirmPassword, password]);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase?.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }, [router]);

  const profileStatus = profile?.subscriptionStatus ?? billing?.subscriptionStatus ?? null;
  const familySummary = useMemo(() => {
    if (billing?.plan === "family") {
      const cap = billing.familySeatsCap ?? 3;
      const used = billing.familySeatsUsed;
      const licenseCountLabel =
        typeof used === "number" ? `${used} of ${cap} licenses used` : `Up to ${cap} licenses`;
      const body = billing.isFamilyBillingMaster
        ? ""
        : "You are on a sibling seat under your household’s Family plan. Each sibling has their own sign-in and workspace; billing is shared with the master account.";
      return {
        title: "Family plan",
        body,
        actionLabel: "Manage billing",
        licenseCountLabel,
      };
    }
    if (billing?.plan === "starter") {
      return {
        title: "Individual plan",
        body: "This subscription includes 1 learner license for a single child account.",
        actionLabel: "View plans",
        licenseCountLabel: "1 of 1 license used",
      };
    }
    return {
      title: "No family licenses yet",
      body: "Upgrade to a paid plan to assign learner licenses and manage child accounts here.",
      actionLabel: "View plans",
      licenseCountLabel: "No active licenses",
    };
  }, [billing?.plan, billing?.familySeatsCap, billing?.familySeatsUsed, billing?.isFamilyBillingMaster]);

  const renewalLabel =
    billing?.cancelAtPeriodEnd === true ? "Access ends on" : "Renews on";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] bg-[#f8fafc] text-[#111827]">
      <div className="flex items-start justify-between gap-4 border-b border-[#e5e7eb] px-5 py-4 sm:px-6">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-[#111827]">
            Account Settings
          </h2>
          <p className="mt-1 text-sm text-[#6b7280]">
            Manage billing, profile details, and sign-in settings.
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white text-[#4b5563] transition hover:bg-[#f9fafb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
          >
            <X className="size-5" strokeWidth={2} aria-hidden />
          </button>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <aside className="shrink-0 border-b border-[#e5e7eb] bg-white/70 p-3 lg:w-60 lg:border-b-0 lg:border-r lg:p-4">
          <nav className="flex gap-2 overflow-x-auto lg:flex-col" aria-label="Settings sections">
            {TAB_ITEMS.map(({ id, label, Icon }) => {
              const active = id === activeTab;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onTabChange(id)}
                  className={[
                    "flex min-w-fit items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition lg:w-full",
                    active
                      ? "bg-[#ecfccb] text-[#365314] ring-1 ring-[#84c126]/25"
                      : "text-[#4b5563] hover:bg-[#f3f4f6] hover:text-[#111827]",
                  ].join(" ")}
                >
                  <Icon className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {accountLoading ? (
            <PanelCard title="Loading settings">
              <p className="text-sm text-[#6b7280]">Hang tight while we load your account.</p>
            </PanelCard>
          ) : null}

          {!accountLoading && accountError ? (
            <PanelCard title="Account unavailable">
              <p className="text-sm text-red-600">{accountError}</p>
            </PanelCard>
          ) : null}

          {!accountLoading && !accountError && activeTab === "plan-billing" ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <PanelCard title="Current plan">
                  <p className="font-display overflow-hidden text-lg font-bold text-[#111827] whitespace-nowrap text-ellipsis sm:text-xl">
                    {formatPlanLabel(billing?.plan ?? null)}
                    {(() => {
                      const line = planPriceLineForSettings(billing);
                      return line ? ` (${line})` : "";
                    })()}
                  </p>
                  {billing?.discountPromotionCode ? (
                    <p className="mt-1 text-xs text-[#6b7280]">
                      Promo Code:{" "}
                      <span className="font-mono text-[10px] font-semibold tracking-wide text-[#111827] sm:text-[11px]">
                        {billing.discountPromotionCode}
                      </span>
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm text-[#6b7280]">
                    {billing?.plan
                      ? `${formatBillingLabel(billing.billing)} billing`
                      : "Choose a plan to unlock paid workspace features."}
                  </p>
                </PanelCard>
                <PanelCard title="Subscription status">
                  <p className="font-display overflow-hidden text-lg font-bold text-[#111827] whitespace-nowrap text-ellipsis sm:text-xl">
                    {formatSubscriptionStatus(billing?.subscriptionStatus ?? profileStatus)}
                  </p>
                  <p className="mt-2 text-sm text-[#6b7280]">
                    {formatSubscriptionStatusMessage(
                      billing?.subscriptionStatus ?? profileStatus,
                    )}
                  </p>
                </PanelCard>
                <PanelCard title={renewalLabel}>
                  <p className="font-display overflow-hidden text-lg font-bold text-[#111827] whitespace-nowrap text-ellipsis sm:text-xl">
                    {formatDateLabel(billing?.currentPeriodEnd ?? null)}
                  </p>
                  <p className="mt-2 text-sm text-[#6b7280]">
                    {billing?.cancelAtPeriodEnd
                      ? "Your subscription is set to stop at the end of the current period."
                      : "Your plan will renew automatically."}
                  </p>
                </PanelCard>
                <PanelCard title="Payment method">
                  {billingLoading ? (
                    <p className="text-sm text-[#6b7280]">Loading payment method…</p>
                  ) : billing?.paymentMethod ? (
                    <>
                      <p className="font-display overflow-hidden text-lg font-bold text-[#111827] whitespace-nowrap text-ellipsis sm:text-xl">
                        Card ending in {billing.paymentMethod.last4}
                      </p>
                      <p className="mt-2 text-sm text-[#6b7280]">
                        Expires {billing.paymentMethod.expMonth}/{billing.paymentMethod.expYear}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-[#6b7280]">
                      Saved payment details will appear here after checkout or in Stripe billing.
                    </p>
                  )}
                </PanelCard>
              </div>

              <PanelCard title="Billing actions">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void openBillingPortal()}
                    disabled={portalLoading || !billing?.portalAvailable}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#84c126] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#6fa020] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {portalLoading ? "Opening billing…" : "Manage billing"}
                  </button>
                  <Link
                    href="/plans"
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#d1d5db] bg-white px-4 py-2.5 text-sm font-semibold text-[#374151] transition hover:bg-[#f9fafb]"
                  >
                    Change plan
                  </Link>
                </div>
                {portalMessage ? (
                  <p className="mt-3 text-sm text-red-600">{portalMessage}</p>
                ) : null}
                {billingError ? (
                  <p className="mt-3 text-sm text-red-600">{billingError}</p>
                ) : null}
                <p className="mt-3 text-sm text-[#6b7280]">
                  Payment methods, invoices, cancellations, and renewals are managed securely in
                  Stripe.
                </p>
              </PanelCard>
            </div>
          ) : null}

          {!accountLoading && !accountError && activeTab === "family" ? (
            <div className="space-y-4">
              <PanelCard title={familySummary.title}>
                {familySummary.body.trim() ? (
                  <p className="text-sm leading-relaxed text-[#4b5563]">{familySummary.body}</p>
                ) : null}
                <p
                  className={
                    familySummary.body.trim()
                      ? "mt-3 text-sm font-semibold text-[#111827]"
                      : "text-sm font-semibold text-[#111827]"
                  }
                >
                  {familySummary.licenseCountLabel}
                </p>
                {billing?.plan === "family" ? (
                  <div className="mt-4 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                          Household payment method
                        </p>
                        {billing.paymentMethod ? (
                          <>
                            <p className="mt-1 font-display text-base font-bold text-[#111827]">
                              Card ending in {billing.paymentMethod.last4}
                            </p>
                            <p className="mt-1 text-sm text-[#6b7280]">
                              Expires {billing.paymentMethod.expMonth}/{billing.paymentMethod.expYear}
                            </p>
                          </>
                        ) : (
                          <p className="mt-1 text-sm text-[#6b7280]">
                            Saved payment details will appear here after checkout or when you add a
                            card in billing.
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => void openBillingPortal()}
                        disabled={portalLoading || !billing?.portalAvailable}
                        className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-xl bg-[#84c126] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#6fa020] disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto sm:w-auto sm:justify-center"
                      >
                        {portalLoading ? "Opening billing…" : familySummary.actionLabel}
                      </button>
                    </div>
                  </div>
                ) : null}
              </PanelCard>
              <PanelCard title="Learner licenses">
                {billing?.plan === "family" ? (
                  <>
                    {familyRosterLoading ? (
                      <p className="mt-3 text-sm text-[#6b7280]">Loading roster…</p>
                    ) : familyRosterError ? (
                      <p className="mt-3 text-sm text-red-600">{familyRosterError}</p>
                    ) : familyRoster.length > 0 ? (
                      <ul className="mt-3 space-y-2">
                        {familyRoster.map((m) => (
                          <li
                            key={m.userId}
                            className="flex items-center justify-between rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm"
                          >
                            <span className="font-semibold text-[#111827]">
                              {m.username?.trim() || `Learner ${m.userId.slice(0, 8)}`}
                            </span>
                            {m.isMaster ? (
                              <span className="text-xs font-semibold text-[#365314]">Master</span>
                            ) : (
                              <span className="text-xs text-[#6b7280]">Sibling</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {billing.isFamilyBillingMaster &&
                    typeof billing.familySeatsUsed === "number" &&
                    typeof billing.familySeatsCap === "number" &&
                    billing.familySeatsUsed < billing.familySeatsCap ? (
                      <div className="mt-5 border-t border-[#e5e7eb] pt-5">
                        <p className="text-sm font-semibold text-[#111827]">Add a sibling account</p>
                        <p className="mt-1 text-sm text-[#6b7280]">
                          Creates a new codename and password. They sign in separately and get their
                          own workspace.
                        </p>
                        <div className="mt-3 flex max-w-full flex-col gap-3 sm:max-w-2xl">
                          <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <label className="min-w-0 text-xs font-semibold text-[#6b7280]">
                              Codename
                              <input
                                value={siblingUsername}
                                onChange={(e) => setSiblingUsername(e.target.value)}
                                autoComplete="off"
                                className="mt-1 w-full rounded-xl border border-[#d1d5db] bg-white px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#84c126] focus:ring-2 focus:ring-[#84c126]/25"
                                placeholder="sibling_codename"
                              />
                            </label>
                            <label className="min-w-0 text-xs font-semibold text-[#6b7280]">
                              Password (min 8 characters)
                              <input
                                type="password"
                                value={siblingPassword}
                                onChange={(e) => setSiblingPassword(e.target.value)}
                                autoComplete="new-password"
                                className="mt-1 w-full rounded-xl border border-[#d1d5db] bg-white px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#84c126] focus:ring-2 focus:ring-[#84c126]/25"
                              />
                            </label>
                          </div>
                          <label className="text-xs font-semibold text-[#6b7280]">
                            Birth date (optional)
                            <input
                              type="date"
                              value={siblingBirthDate}
                              onChange={(e) => setSiblingBirthDate(e.target.value)}
                              className="mt-1 w-full rounded-xl border border-[#d1d5db] bg-white px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#84c126] focus:ring-2 focus:ring-[#84c126]/25"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => void submitAddSibling()}
                            disabled={addSiblingLoading}
                            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#84c126] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#6fa020] disabled:opacity-60"
                          >
                            {addSiblingLoading ? "Creating…" : "Create sibling account"}
                          </button>
                          {addSiblingMessage ? (
                            <p
                              className={`text-sm ${addSiblingMessage.includes("wrong") || addSiblingMessage.includes("Could not") || addSiblingMessage.includes("taken") ? "text-red-600" : "text-[#365314]"}`}
                            >
                              {addSiblingMessage}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : billing?.plan === "starter" ? (
                  <>
                    <p className="text-sm leading-relaxed text-[#4b5563]">
                      This individual plan is assigned to{" "}
                      <span className="font-semibold text-[#111827]">
                        {profile?.codename ?? "this learner"}
                      </span>
                      .
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-[#4b5563]">
                      You are currently using 1 of 1 available license. Upgrade to the Family plan
                      if you want up to 3 learner licenses under the same subscription.
                    </p>
                  </>
                ) : (
                  <p className="text-sm leading-relaxed text-[#4b5563]">
                    Once this account has a paid plan, this section will show which learner
                    codenames are covered by the subscription and how many licenses are in use.
                  </p>
                )}
              </PanelCard>
              {billing?.plan !== "family" ? (
                <div>
                  <Link
                    href="/plans"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#d1d5db] bg-transparent px-4 py-2.5 text-sm font-semibold text-[#374151] transition hover:bg-[#f9fafb]"
                  >
                    View plans
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}

          {!accountLoading && !accountError && activeTab === "profile" ? (
            <div className="space-y-4">
              <PanelCard title="Learner profile">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#ecfccb] ring-2 ring-[#84c126]/25">
                    {profile?.avatarSlug ? (
                      <Image
                        src={OLLIE_AVATARS.find((avatar) => avatar.id === profile.avatarSlug)?.src ?? ""}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold uppercase text-[#365314]" aria-hidden>
                        {profile?.codename.slice(0, 1) ?? "?"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                      Codename
                    </p>
                    <p className="font-display mt-1 text-2xl font-bold text-[#111827]">
                      {profile?.codename ?? "Unknown"}
                    </p>
                    <p className="mt-2 text-sm text-[#6b7280]">
                      Your avatar and learner identity show up across the workspace and profile
                      areas.
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Link
                    href="/profile"
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#d1d5db] bg-white px-4 py-2.5 text-sm font-semibold text-[#374151] transition hover:bg-[#f9fafb]"
                  >
                    Open full profile
                  </Link>
                </div>
              </PanelCard>

              <PanelCard title="Choose an avatar">
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
                  {OLLIE_AVATARS.map((avatar) => {
                    const selected = profile?.avatarSlug === avatar.id;
                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        disabled={avatarSaving}
                        onClick={() => void saveAvatar(avatar.id)}
                        aria-label={`Choose ${avatar.label}`}
                        className={[
                          "relative aspect-square overflow-hidden rounded-2xl border bg-white shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2",
                          selected
                            ? "border-[#84c126] ring-2 ring-[#84c126]/25"
                            : "border-[#d1d5db] hover:border-[#9ca3af]",
                        ].join(" ")}
                      >
                        <Image
                          src={avatar.src}
                          alt=""
                          fill
                          className="object-contain p-1.5"
                        />
                      </button>
                    );
                  })}
                </div>
                {avatarMessage ? (
                  <p className="mt-3 text-sm text-[#4b5563]">{avatarMessage}</p>
                ) : null}
              </PanelCard>
            </div>
          ) : null}

          {!accountLoading && !accountError && activeTab === "login-security" ? (
            <div className="space-y-4">
              <PanelCard title="Account access">
                <dl className="grid gap-3">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                      Sign-in codename
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-[#111827]">
                      {profile?.codename ?? "Unknown"}
                    </dd>
                  </div>
                </dl>
              </PanelCard>

              <PanelCard title="Change password">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-semibold text-[#374151]">
                    New password
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d1d5db] px-3 py-2.5 text-sm text-[#111827]"
                      autoComplete="new-password"
                      minLength={6}
                    />
                  </label>
                  <label className="text-sm font-semibold text-[#374151]">
                    Confirm password
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d1d5db] px-3 py-2.5 text-sm text-[#111827]"
                      autoComplete="new-password"
                      minLength={6}
                    />
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void updatePassword()}
                    disabled={passwordLoading}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#84c126] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#6fa020] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {passwordLoading ? "Updating password…" : "Update password"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#d1d5db] bg-white px-4 py-2.5 text-sm font-semibold text-[#374151] transition hover:bg-[#f9fafb]"
                  >
                    Sign out
                  </button>
                </div>
                {passwordMessage ? (
                  <p className="mt-3 text-sm text-[#4b5563]">{passwordMessage}</p>
                ) : null}
              </PanelCard>
            </div>
          ) : null}

          {!accountLoading && !accountError && activeTab === "support-privacy" ? (
            <div className="space-y-4">
              <PanelCard title="Privacy and terms">
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/legal/privacy"
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#d1d5db] bg-white px-4 py-2.5 text-sm font-semibold text-[#374151] transition hover:bg-[#f9fafb]"
                  >
                    Privacy policy
                    <ExternalLink className="size-4" strokeWidth={2} aria-hidden />
                  </Link>
                  <Link
                    href="/legal/terms"
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#d1d5db] bg-white px-4 py-2.5 text-sm font-semibold text-[#374151] transition hover:bg-[#f9fafb]"
                  >
                    Terms
                    <ExternalLink className="size-4" strokeWidth={2} aria-hidden />
                  </Link>
                </div>
              </PanelCard>
              <PanelCard title="Need more help?">
                <p className="text-sm leading-relaxed text-[#4b5563]">
                  If you need account changes that are not in settings yet, use the support contact
                  options elsewhere on the site and mention your codename so the team can find the
                  right account quickly.
                </p>
              </PanelCard>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
