import { cn } from "@/lib/ui";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
    className={cn("animate-pulse rounded-xl bg-slate-800/40", className)}
      {...props}
    />
  );
}
