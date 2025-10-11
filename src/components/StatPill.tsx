import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/ui";

const statPillVariants = cva(
  "inline-flex min-w-[84px] flex-col rounded-2xl border px-4 py-3 text-center",
  {
    variants: {
      tone: {
        good: "border-violet-400/60 bg-violet-500/15 text-violet-100",
        neutral: "border-white/10 bg-white/5 text-slate-200/90",
        bad: "border-red-400/50 bg-red-500/15 text-red-100",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

interface StatPillProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statPillVariants> {
  label: string;
  value: string;
  caption?: string;
}

export function StatPill({
  label,
  value,
  caption,
  tone,
  className,
  ...props
}: StatPillProps) {
  return (
    <div className={cn(statPillVariants({ tone }), className)} {...props}>
      <span className="text-xs uppercase tracking-wide text-slate-300/65">
        {label}
      </span>
      <span className="text-xl font-semibold text-slate-50">{value}</span>
      {caption ? (
        <span className="text-xs text-slate-300/65">{caption}</span>
      ) : null}
    </div>
  );
}
