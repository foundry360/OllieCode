import type { Metadata } from "next";
import { LegalDocument, LegalSection } from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Terms of Use — Ollie Code",
  description: "Terms of Use for the Ollie Code learning platform.",
};

export default function TermsOfUsePage() {
  return (
    <LegalDocument title="Terms of Use" lastUpdated="April 19, 2026">
      <p className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <strong className="font-semibold">Draft for review.</strong> This is starter language for
        development and demos. Have qualified legal counsel review and replace it before serving
        real users or collecting personal information.
      </p>

      <LegalSection id="agreement" heading="Agreement to these terms">
        <p>
          By accessing or using Ollie Code (&ldquo;Service,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;),
          you agree to these Terms of Use. If you do not agree, do not use the Service.
        </p>
      </LegalSection>

      <LegalSection id="eligibility" heading="Eligibility and accounts">
        <p>
          The Service is intended for learners roughly ages 7–13 with appropriate supervision and
          consent from a parent or guardian where required. You are responsible for keeping login
          credentials confidential and for activity under your account.
        </p>
      </LegalSection>

      <LegalSection id="acceptable-use" heading="Acceptable use">
        <p>You agree not to misuse the Service. For example, you must not:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Attempt to access data or systems you are not authorized to use.</li>
          <li>Upload malware, harass others, or distribute unlawful content.</li>
          <li>Reverse engineer or disrupt the Service except as permitted by law.</li>
        </ul>
      </LegalSection>

      <LegalSection id="content" heading="Your content">
        <p>
          You retain rights to projects and materials you create. You grant us a limited license to
          host, process, and display that content as needed to operate the Service (for example, to
          save your workspace and show it to you when you sign in).
        </p>
      </LegalSection>

      <LegalSection id="disclaimer" heading="Disclaimers">
        <p>
          The Service is provided &ldquo;as is&rdquo; without warranties of any kind, to the fullest
          extent permitted by law. We do not guarantee uninterrupted or error-free operation.
        </p>
      </LegalSection>

      <LegalSection id="limitation" heading="Limitation of liability">
        <p>
          To the maximum extent permitted by law, we are not liable for indirect, incidental, special,
          consequential, or punitive damages, or any loss of profits or data, arising from your use
          of the Service.
        </p>
      </LegalSection>

      <LegalSection id="changes" heading="Changes">
        <p>
          We may update these terms from time to time. We will post the revised terms on this page
          and update the &ldquo;Last updated&rdquo; date. Continued use after changes constitutes
          acceptance of the updated terms, to the extent allowed by law.
        </p>
      </LegalSection>

      <LegalSection id="contact" heading="Contact">
        <p>
          For questions about these Terms, contact the team operating this deployment of Ollie Code
          using the support or contact method they publish for your organization.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
