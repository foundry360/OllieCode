import type { Metadata } from "next";
import { LegalDocument, LegalSection } from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Privacy Policy — Ollie Code",
  description: "Privacy Policy for the Ollie Code learning platform.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument title="Privacy Policy" lastUpdated="April 19, 2026">
      <p className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <strong className="font-semibold">Draft for review.</strong> This is starter language for
        development and demos. Have qualified legal counsel review and adapt it for your
        jurisdiction, audience (including children), and data practices before production use.
      </p>

      <LegalSection id="overview" heading="Overview">
        <p>
          This Privacy Policy describes how Ollie Code (&ldquo;we,&rdquo; &ldquo;us&rdquo;) handles
          information when you use our website and learning platform (the &ldquo;Service&rdquo;).
        </p>
      </LegalSection>

      <LegalSection id="collect" heading="Information we may collect">
        <p>Depending on how the Service is configured, we may collect:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="font-semibold text-[#111827]">Account information</strong> — for
            example, email address or identifiers provided when you sign up or sign in.
          </li>
          <li>
            <strong className="font-semibold text-[#111827]">Learning activity</strong> — such as
            progress, projects, or lesson interactions needed to run the classroom experience.
          </li>
          <li>
            <strong className="font-semibold text-[#111827]">Technical data</strong> — such as
            browser type, basic logs, and security signals to keep the Service reliable and safe.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="use" heading="How we use information">
        <p>We use information to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Provide, secure, and improve the Service.</li>
          <li>Authenticate users and maintain sessions.</li>
          <li>Support educators and organizations using Ollie Code, as applicable.</li>
        </ul>
      </LegalSection>

      <LegalSection id="cookies" heading="Cookies and similar technologies">
        <p>
          We use cookies and similar technologies that are necessary to operate the Service — for
          example, to keep you signed in when you use Supabase-backed authentication. If we add
          analytics or marketing technologies that are not strictly necessary, we will describe them
          here and obtain consent where required by law.
        </p>
      </LegalSection>

      <LegalSection id="sharing" heading="Sharing">
        <p>
          We use service providers (such as hosting and authentication vendors) to run the Service.
          We do not sell your personal information. We may disclose information if required by law
          or to protect rights, safety, and security.
        </p>
      </LegalSection>

      <LegalSection id="retention" heading="Retention">
        <p>
          We retain information for as long as needed to provide the Service and fulfill the
          purposes described in this policy, unless a longer period is required by law.
        </p>
      </LegalSection>

      <LegalSection id="rights" heading="Your choices and rights">
        <p>
          Depending on where you live, you may have rights to access, correct, or delete certain
          personal information, or to object to or restrict some processing. Contact us using the
          method your school or organization provides, or the contact published for this deployment.
        </p>
      </LegalSection>

      <LegalSection id="children" heading="Children">
        <p>
          The Service is designed for young learners. Where children&apos;s privacy laws apply,
          parents or guardians may need to provide consent or manage accounts. Describe your
          age-gating, parental notice, and verifiable parental consent flows here after counsel
          review.
        </p>
      </LegalSection>

      <LegalSection id="changes" heading="Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. We will post changes on this page and
          update the &ldquo;Last updated&rdquo; date.
        </p>
      </LegalSection>

      <LegalSection id="contact" heading="Contact">
        <p>
          For privacy questions, contact the team operating this deployment of Ollie Code using the
          support or privacy contact they publish for your organization.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
