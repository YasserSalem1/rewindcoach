"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Github } from "lucide-react";

import { useLocalStorage } from "@/hooks/useLocalStorage";
import { cn } from "@/lib/ui";

const NAV_VARIANTS = {
  hover: { y: -2, scale: 1.02 },
  initial: { y: 0, scale: 1 },
};

export function Header() {
  const pathname = usePathname();
  const [profilePref] = useLocalStorage<{
    region: string;
    gameName: string;
    tagLine: string;
  }>("rewindcoach:last-profile", {
    region: "",
    gameName: "",
    tagLine: "",
  });

  const profileHref =
    profilePref &&
    profilePref.region &&
    profilePref.gameName &&
    profilePref.tagLine
      ? `/profile/${encodeURIComponent(profilePref.region)}/${encodeURIComponent(profilePref.gameName)}/${encodeURIComponent(profilePref.tagLine)}`
      : "/";

  const links = [
    { href: profileHref, label: "Profile" },
    {
      href: "https://github.com/",
      label: "GitHub",
      external: true,
      icon: <Github className="h-4 w-4" />,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/60 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 text-slate-200 transition hover:opacity-90"
        >
          <Image
            src="/images/logo.png"
            alt="RewindCoach logo"
            width={40}
            height={40}
            className="drop-shadow-[0_0_12px_rgba(99,102,241,0.35)]"
            priority
          />
          <span className="font-heading text-xl font-semibold tracking-tight">
            RewindCoach
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-300">
          {links.map((link) => {
            const isActive =
              !link.external &&
              link.href !== "/" &&
              pathname?.startsWith(link.href);
            return (
              <motion.div
                key={link.href}
                variants={NAV_VARIANTS}
                initial="initial"
                whileHover="hover"
                className={cn(
                  "relative flex items-center gap-2 rounded-full px-3 py-1 transition",
                  isActive ? "bg-violet-500/20 text-slate-100" : undefined,
                )}
              >
                {link.external ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    {link.icon}
                    {link.label}
                  </a>
                ) : (
                  <Link href={link.href} className="flex items-center gap-2">
                    {link.icon}
                    {link.label}
                  </Link>
                )}
              </motion.div>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
