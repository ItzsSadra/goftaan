"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium tracking-wide uppercase",
  {
    variants: {
      variant: {
        default:
          "bg-accent/8 text-accent border border-accent/10",
        secondary:
          "bg-surface-elevated/60 text-text-secondary border border-border/50",
        destructive:
          "bg-danger-bg text-danger border border-danger-border/50",
        outline: "text-text-muted border border-border/30",
        success:
          "bg-success-bg text-success border border-success-border/50",
        warning:
          "bg-warning/8 text-warning border border-warning/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
