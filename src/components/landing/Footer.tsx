import Link from "next/link";

const FOOTER_LINKS = [
  { href: "#features", label: "Programs" },
  { href: "/auth/login?next=/workspace", label: "Workspace" },
  { href: "/auth/login?next=/workspace", label: "Sign in" },
];

export function Footer() {
  return (
    <footer className="border-t border-[#e5e7eb] bg-white px-4 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 sm:flex-row sm:justify-between">
        <div className="text-center sm:text-left">
          <p className="font-display text-xl font-bold text-[#111827]">David Code</p>
          <p className="mt-1 text-sm text-[#6b7280]">Fun coding for kids 7–13.</p>
        </div>
        <nav className="flex flex-wrap justify-center gap-6 text-sm font-semibold text-[#374151]">
          {FOOTER_LINKS.map((l) => (
            <Link key={l.label} href={l.href} className="hover:text-[#84c126]">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex gap-4" aria-label="Social links">
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f4f6] text-[#111827] transition hover:bg-[#84c126] hover:text-white"
            aria-label="YouTube"
          >
            <SocialIconYouTube />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f4f6] text-[#111827] transition hover:bg-[#84c126] hover:text-white"
            aria-label="Instagram"
          >
            <SocialIconInstagram />
          </a>
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f4f6] text-[#111827] transition hover:bg-[#84c126] hover:text-white"
            aria-label="Facebook"
          >
            <SocialIconFacebook />
          </a>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-6xl text-center text-xs text-[#9ca3af]">
        ©{" "}
        <span suppressHydrationWarning>{new Date().getFullYear()}</span> David
        Code. Scaffold for demos — replace links and copy for production.
      </p>
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
