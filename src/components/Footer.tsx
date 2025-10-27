export function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-slate-950/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-slate-300/80 md:flex-row">
        <p>© {new Date().getFullYear()} RewindCoach. Craft your climb.</p>
        <p className="text-slate-400/70">
          Built for RiotAmazon RiftRewind Hackathon. Background art © Riot Games
          (Summoner&apos;s Rift).
        </p>
      </div>
    </footer>
  );
}
