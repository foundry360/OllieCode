import { Suspense } from "react";
import { LoginForm } from "@/app/auth/login/login-form";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";

function FormFallback() {
  return <p className="text-sm text-[#6b7280]">Loading…</p>;
}

export default function LoginPage() {
  return (
    <AuthSplitLayout
      pageBackgroundSrc="/images/landing_bg.png"
      showIllustration={false}
    >
      <Suspense fallback={<FormFallback />}>
        <LoginForm />
      </Suspense>
    </AuthSplitLayout>
  );
}
