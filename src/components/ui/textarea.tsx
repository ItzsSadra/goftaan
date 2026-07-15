import * as React from "react"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[120px] w-full rounded-[20px] border border-border/50 bg-surface-elevated/30 px-5 py-4 text-[15px] text-text-primary placeholder:text-text-muted/60 transition-all duration-500 focus-visible:outline-none focus-visible:border-accent/30 focus-visible:bg-surface-elevated/50 focus-visible:shadow-lg focus-visible:shadow-accent/5 disabled:cursor-not-allowed disabled:opacity-40 resize-none leading-relaxed",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
