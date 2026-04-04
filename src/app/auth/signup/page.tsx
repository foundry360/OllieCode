import { SignupWizard } from "@/app/auth/signup/signup-wizard";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";

export default function SignupPage() {
  return (
    <AuthSplitLayout>
      <SignupWizard />
    </AuthSplitLayout>
  );
}
