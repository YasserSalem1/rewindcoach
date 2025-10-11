import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/ui";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition",
  {
    variants: {
      variant: {
        default: "border-violet-400/50 bg-violet-500/10 text-violet-100",
        good:
          "border-sky-400/60 bg-sky-400/15 text-sky-100 shadow-[0_0_18px_rgba(14,165,233,0.35)]",
        neutral:
          "border-white/20 bg-white/5 text-slate-200/80 backdrop-blur",
        bad: "border-red-400/60 bg-red-500/10 text-red-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
