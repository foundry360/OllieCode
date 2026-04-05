import Image from "next/image";
import Link from "next/link";

type OllieLogoLinkProps = {
  className?: string;
};

/** Wordmark used on auth pages; matches landing nav scale. */
export function OllieLogoLink({ className }: OllieLogoLinkProps) {
  return (
    <Link href="/" className={["block w-fit shrink-0", className].filter(Boolean).join(" ")}>
      <Image
        src="/images/logo.png"
        alt="Ollie Code"
        width={434}
        height={91}
        className="h-8 w-auto sm:h-9"
        priority
      />
    </Link>
  );
}
