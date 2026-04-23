import { subscriptionAllowsWorkspace } from "@/lib/billing/profileSubscription";

type ProfileGate = {
  subscription_status?: string | null;
  is_admin?: boolean | null;
} | null;

/**
 * After sign-in: admins and subscribers follow `next` (maps old welcome URLs to workspace).
 * Users without an active subscription always land in `/workspace` where the paywall modal runs.
 */
export function resolvePostLoginPath(next: string, profile: ProfileGate): string {
  if (profile?.is_admin === true) {
    return next;
  }

  const subscribed = subscriptionAllowsWorkspace(profile?.subscription_status);
  if (subscribed) {
    if (next.startsWith("/plans/welcome")) {
      return "/workspace";
    }
    return next;
  }

  return "/workspace";
}
