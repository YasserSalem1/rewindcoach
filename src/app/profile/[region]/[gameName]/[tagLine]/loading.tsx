import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-slate-950/70 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          <Skeleton className="h-24 w-24 rounded-3xl" />
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-20 w-full rounded-2xl md:w-80" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr,1.8fr,1fr]">
        <Skeleton className="h-[28rem] rounded-3xl" />
        <Skeleton className="h-[28rem] rounded-3xl" />
        <Skeleton className="h-[28rem] rounded-3xl" />
      </div>
    </div>
  );
}
