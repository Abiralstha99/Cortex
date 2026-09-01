"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-[var(--radius-pill)] border border-transparent bg-transparent shadow-none transition-[color,box-shadow] duration-150 outline-none before:absolute before:h-5 before:w-9 before:rounded-[var(--radius-pill)] before:bg-primary-soft before:transition-colors before:duration-150 data-[size=sm]:before:h-4 data-[size=sm]:before:w-7 data-[state=checked]:before:bg-primary focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none absolute top-1/2 left-1/2 block -translate-y-1/2 rounded-[var(--radius-pill)] bg-white ring-0 transition-transform duration-150 group-data-[size=default]/switch:size-4 group-data-[size=default]/switch:data-[state=unchecked]:-translate-x-[calc(50%+10px)] group-data-[size=default]/switch:data-[state=checked]:translate-x-[calc(-50%+10px)] group-data-[size=sm]/switch:size-3 group-data-[size=sm]/switch:data-[state=unchecked]:-translate-x-[calc(50%+8px)] group-data-[size=sm]/switch:data-[state=checked]:translate-x-[calc(-50%+8px)]"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
