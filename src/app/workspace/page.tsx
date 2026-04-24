import { WorkspacePageClient } from "@/app/workspace/workspace-page-client";
import { WorkspaceSubscriptionPaywall } from "@/app/workspace/workspace-subscription-paywall";
import { getPlanCheckoutAvailability } from "@/lib/stripe/prices";

export const dynamic = "force-dynamic";

export default function WorkspacePage() {
  const checkoutAvailability = getPlanCheckoutAvailability();

  return (
    <WorkspaceSubscriptionPaywall checkoutAvailability={checkoutAvailability}>
      <WorkspacePageClient />
    </WorkspaceSubscriptionPaywall>
  );
}
