import Image from "next/image";

import { SearchCard } from "@/components/SearchCard";

export default function Home() {
  return (
    <section className="relative isolate flex min-h-[calc(100vh-160px)] items-center justify-center overflow-hidden px-4 py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.3),transparent_65%)]" />
      <div className="absolute inset-0 opacity-30">
        <Image
          src="/images/background.png"
          alt="Summoner's Rift vignette"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-10 text-center">
        <div className="flex flex-col items-center gap-8">
          <Image
            src="/images/Logo.png"
            alt="RewindCoach emblem"
            width={500}
            height={500}
            priority
            className="drop-shadow-[0_35px_120px_rgba(99,102,241,0.3)]"
          />
          <p className="max-w-2xl text-lg text-slate-200/80">
            Generate your playstyle DNA, comb through every match, and ask an AI
            coach why fights swung the way they did. Your season, rewound with
            clarity.
          </p>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400/80">
            Built for RiotAmazon RiftRewind Hackathon
          </p>
        </div>
        <SearchCard />
      </div>
    </section>
  );
}
