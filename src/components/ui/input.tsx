import * as React from "react";

import { cn } from "@/lib/ui";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-slate-100 outline-none placeholder:text-slate-300/50 ring-violet-400 transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
