import type { Metadata } from "next";
import { Fredoka, Nunito, Open_Sans } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Ollie Code — Learn to code, build games, create with AI",
  description:
    "A fun, simple coding platform for kids ages 7–13. Blockly workspace, canvas, and sounds.",
  icons: {
    icon: [{ url: "/favicon.ico", type: "image/x-icon" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${fredoka.variable} ${openSans.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#f8fafc] font-sans text-[#111827]">
        {children}
      </body>
    </html>
  );
}
