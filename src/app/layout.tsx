import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import Image from "next/image";

import { Footer } from "@/components/Footer";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rewindcoach.app";

export const metadata: Metadata = {
  title: "RewindCoach – League of Legends Year-in-Review Coach",
  description:
    "RewindCoach blends your League of Legends year-in-review with match-by-match coaching. Review timelines, style DNA, and get Bedrock-powered insights.",
  openGraph: {
    title: "RewindCoach",
    description:
      "Unlock your League of Legends playstyle fingerprint and review every match with an interactive coach.",
    url: baseUrl,
    siteName: "RewindCoach",
    images: [
      {
        url: `${baseUrl}/og.png`,
        width: 1200,
        height: 630,
        alt: "RewindCoach",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RewindCoach",
    description:
      "Interactive match reviews, timeline scrubbing, and style DNA insights for every League of Legends player.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${archivo.variable} font-body antialiased`}
      >
        <div className="relative flex min-h-screen flex-col bg-slate-950/95">
          {/* Background that appears on all pages */}
          <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.3),transparent_65%)]" />
          <div className="fixed inset-0 z-0 opacity-30">
            <Image
              src="/images/background.png"
              alt="Summoner's Rift background"
              fill
              className="object-cover"
              priority
            />
          </div>
          
          {/* Content */}
          <main className="relative z-10 flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
