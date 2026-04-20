import Image from "next/image";
import Link from "next/link";
import { ContactChatLauncher } from "@/components/landing/ContactChatLauncher";

const EXPLORE_LINKS = [
  { href: "/#features", label: "What we do" },
  { href: "/#stories", label: "Fun stuff" },
];

const START_LINKS = [
  { href: "/auth/login", label: "Sign in" },
  { href: "/auth/signup", label: "Create an account" },
  { href: "/auth/login?next=/workspace", label: "Open workspace" },
];

const STAFF_LINKS = [{ href: "/staff/login", label: "Staff login" }];

const LEGAL_LINKS = [
  { href: "/legal/terms", label: "Terms of Use" },
  { href: "/legal/privacy", label: "Privacy Policy" },
];

export function Footer() {
  return (
    <footer className="relative z-10 -mt-14 w-full -translate-y-px bg-[#111727] text-white sm:-mt-16 md:-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          <div className="sm:col-span-2 lg:col-span-4">
            <Link
              href="/"
              className="inline-block shrink-0"
              aria-label="Ollie Code home"
            >
              <Image
                src="/images/logo_blue.png"
                alt=""
                width={434}
                height={91}
                className="h-9 w-auto sm:h-10"
              />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/90">
              Fun, block-based coding for kids 7–13. Build games, learn logic, and see ideas
              come alive on the canvas.
            </p>
            <div className="mt-6 flex flex-wrap gap-3" aria-label="Social links">
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20 transition hover:bg-white/25"
                aria-label="YouTube"
              >
                <SocialIconYouTube />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20 transition hover:bg-white/25"
                aria-label="Instagram"
              >
                <SocialIconInstagram />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20 transition hover:bg-white/25"
                aria-label="Facebook"
              >
                <SocialIconFacebook />
              </a>
            </div>
          </div>

          <nav
            className="sm:col-span-1 lg:col-span-2"
            aria-labelledby="footer-explore-heading"
          >
            <h2
              id="footer-explore-heading"
              className="text-xs font-bold uppercase tracking-wider text-[#ecfccb]/90"
            >
              Explore
            </h2>
            <ul className="mt-4 space-y-3 text-sm font-semibold">
              {EXPLORE_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-white/95 transition hover:text-white hover:underline"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav
            className="sm:col-span-1 lg:col-span-2"
            aria-labelledby="footer-start-heading"
          >
            <h2
              id="footer-start-heading"
              className="text-xs font-bold uppercase tracking-wider text-[#ecfccb]/90"
            >
              Get started
            </h2>
            <ul className="mt-4 space-y-3 text-sm font-semibold">
              {START_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-white/95 transition hover:text-white hover:underline"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav
            className="sm:col-span-1 lg:col-span-2"
            aria-labelledby="footer-legal-heading"
          >
            <h2
              id="footer-legal-heading"
              className="text-xs font-bold uppercase tracking-wider text-[#ecfccb]/90"
            >
              Legal
            </h2>
            <ul className="mt-4 space-y-3 text-sm font-semibold">
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-white/95 transition hover:text-white hover:underline"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav
            className="sm:col-span-2 lg:col-span-2"
            aria-labelledby="footer-staff-heading"
          >
            <h2
              id="footer-staff-heading"
              className="text-xs font-bold uppercase tracking-wider text-[#ecfccb]/90"
            >
              Educators
            </h2>
            <ul className="mt-4 space-y-3 text-sm font-semibold">
              {STAFF_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-white/95 transition hover:text-white hover:underline"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-6 max-w-xs text-xs leading-relaxed text-white/75">
              Teachers and program leads use staff tools to manage lessons and learners.
            </p>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 text-center sm:px-6 lg:px-8">
        <p className="text-xs text-white/85">
          ©{" "}
          <span suppressHydrationWarning>{new Date().getFullYear()}</span>{" "}
          Ollie Code. All rights reserved.
        </p>
      </div>
      <ContactChatLauncher />
    </footer>
  );
}

function SocialIconYouTube() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-5.8 31 31 0 0 0-.5-5.8zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
    </svg>
  );
}

function SocialIconInstagram() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5a5.5 5.5 0 1 1 0 11 0 5.5 5.5 0 0 1 0-11zm0 2a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM18 6.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
    </svg>
  );
}

function SocialIconFacebook() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13.5 22v-8.5h2.5l.5-3h-3V8.8c0-.9.3-1.5 1.6-1.5H17V4.1c-.3 0-1.4-.1-2.7-.1-2.7 0-4.5 1.6-4.5 4.6V10.5H7v3h3V22h3.5z" />
    </svg>
  );
}
