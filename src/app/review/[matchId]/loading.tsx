import { Skeleton } from "@/components/ui/skeleton";

export default function ReviewLoading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <Skeleton className="h-40 rounded-3xl" />
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-[28rem] rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
        </div>
        <Skeleton className="h-[36rem] rounded-3xl" />
      </div>
    </div>
  );
}
