import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { StaffLoginForm } from "@/app/staff/login/staff-login-form";

export const metadata: Metadata = {
  title: "Staff sign in | Ollie Code",
  description: "Team access to the Ollie Code admin portal.",
  robots: { index: false, follow: false },
};

function FormFallback() {
  return <p className="text-sm text-[#6b7280]">Loading…</p>;
}

export default function StaffLoginPage() {
  return (
    <AuthSplitLayout
      pageBackgroundSrc="/images/landing_bg.png"
      showIllustration={false}
    >
      <Suspense fallback={<FormFallback />}>
        <StaffLoginForm />
      </Suspense>
    </AuthSplitLayout>
  );
}
