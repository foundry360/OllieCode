import { Suspense } from "react";
import { SignupWizard } from "@/app/auth/signup/signup-wizard";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";

function SignupFallback() {
  return <p className="text-sm text-[#6b7280]">Loading…</p>;
}

export default function SignupPage() {
  return (
    <AuthSplitLayout
      pageBackgroundSrc="/images/landing_bg.png"
      showIllustration={false}
    >
      <Suspense fallback={<SignupFallback />}>
        <SignupWizard />
      </Suspense>
    </AuthSplitLayout>
  );
}
