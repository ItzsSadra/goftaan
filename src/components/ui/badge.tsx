"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1.5 text-[11px] font-bold tracking-wide",
  {
    variants: {
      variant: {
        default:
          "bg-accent-soft text-text-primary",
        secondary:
          "bg-background-accent text-text-primary",
        destructive:
          "bg-danger-bg text-danger",
        outline: "text-text-secondary border border-border",
        success:
          "bg-success-bg text-success",
        warning:
          "bg-amber-50 text-warning",
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
