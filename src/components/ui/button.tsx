import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer select-none active:scale-[0.99] active:opacity-90",
  {
    variants: {
      variant: {
        default:
          "bg-accent text-white hover:bg-accent-dark",
        destructive:
          "bg-danger text-white hover:bg-danger/90",
        "destructive-outline":
          "bg-danger-bg text-danger border border-danger-border hover:bg-danger/10",
        outline:
          "border border-border bg-background text-text-primary hover:bg-surface",
        secondary:
          "bg-background border border-border text-text-primary hover:bg-surface",
        ghost:
          "text-text-secondary hover:bg-background-accent hover:text-text-primary",
        link: "text-accent underline-offset-4 hover:underline",
        success:
          "bg-success text-white hover:bg-success/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 px-6 text-sm",
        xl: "h-[50px] rounded-xl px-8 text-[15px]",
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
