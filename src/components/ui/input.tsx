import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-12 w-full rounded-full border border-border/50 bg-surface-elevated/30 px-5 py-3 text-[15px] text-text-primary placeholder:text-text-muted/60 transition-all duration-500 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text-primary focus-visible:outline-none focus-visible:border-accent/30 focus-visible:bg-surface-elevated/50 focus-visible:shadow-lg focus-visible:shadow-accent/5 disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
