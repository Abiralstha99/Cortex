import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-[var(--radius-pill)] border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] duration-150 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/30 aria-invalid:border-danger aria-invalid:ring-danger/20 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "bg-success-soft text-success-foreground [a&]:hover:bg-success-soft/80",
        pink:
          "bg-accent-pink/15 text-ink [a&]:hover:bg-accent-pink/25",
        yellow:
          "bg-accent-yellow/25 text-ink [a&]:hover:bg-accent-yellow/35",
        sky:
          "bg-accent-cyan/15 text-ink [a&]:hover:bg-accent-cyan/25",
        outline:
          "border-border bg-transparent text-ink [a&]:hover:bg-surface",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge }
