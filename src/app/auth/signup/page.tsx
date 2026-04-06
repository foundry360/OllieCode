import { SignupWizard } from "@/app/auth/signup/signup-wizard";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";

export default function SignupPage() {
  return (
    <AuthSplitLayout
      pageBackgroundSrc="/images/landing_bg.png"
      showIllustration={false}
    >
      <SignupWizard />
    </AuthSplitLayout>
  );
}
