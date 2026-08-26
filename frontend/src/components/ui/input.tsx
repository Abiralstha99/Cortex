import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-ink shadow-none outline-none",
        "placeholder:text-muted/70",
        "focus-visible:border-forest focus-visible:ring-[3px] focus-visible:ring-forest/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-danger aria-invalid:ring-danger/20",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
