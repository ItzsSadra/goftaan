"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
  disabled?: boolean
}

function Switch({
  checked = false,
  onCheckedChange,
  className,
  disabled = false,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-all duration-500 ease-out focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40",
        checked ? "bg-accent shadow-md shadow-accent/15" : "bg-surface-elevated border border-border/50",
        className
      )}
      onClick={() => onCheckedChange?.(!checked)}
    >
      <span
        className={cn(
          "pointer-events-none block h-4.5 w-4.5 rounded-full bg-white shadow-sm transition-all duration-500 ease-out",
          checked ? "translate-x-[22px]" : "translate-x-[3px]"
        )}
      />
    </button>
  )
}

export { Switch }
