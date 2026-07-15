import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full text-[15px] font-medium transition-all duration-500 ease-out focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-accent text-background hover:bg-accent-dark hover:shadow-lg hover:shadow-accent/10 active:scale-[0.98]",
        destructive:
          "bg-danger/10 text-danger border border-danger/10 hover:bg-danger/15 active:scale-[0.98]",
        "destructive-outline":
          "bg-danger-bg text-danger border border-danger-border/50 hover:bg-danger/10",
        outline:
          "border border-border bg-transparent text-text-secondary hover:bg-surface-elevated hover:text-text-primary hover:border-border active:scale-[0.98]",
        secondary:
          "bg-surface-elevated/50 border border-border text-text-secondary hover:bg-surface-elevated hover:text-text-primary active:scale-[0.98]",
        ghost:
          "text-text-secondary hover:bg-surface-elevated/50 hover:text-text-primary",
        link: "text-accent underline-offset-4 hover:underline",
        success:
          "bg-success/10 text-success border border-success/10 hover:bg-success/15 active:scale-[0.98]",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-full px-4 text-[13px]",
        lg: "h-13 px-8 text-[15px]",
        xl: "h-14 rounded-full px-10 text-[15px]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
