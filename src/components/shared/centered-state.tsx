import { cn } from "@/lib/utils"

interface CenteredStateProps {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  variant?: "empty" | "error" | "default"
  className?: string
}

export function CenteredState({
  title,
  description,
  action,
  icon: Icon,
  variant = "default",
  className,
}: CenteredStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 sm:py-24 px-6 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mb-5">
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full bg-background-accent",
              variant === "error" && "bg-danger-bg"
            )}
          >
            <Icon
              className={cn(
                "h-8 w-8 text-text-muted",
                variant === "error" && "text-danger"
              )}
            />
          </div>
        </div>
      )}
      <h3 className="text-[17px] font-bold text-text-primary">{title}</h3>
      {description && (
        <p className="mt-2 text-[14px] text-text-secondary max-w-xs leading-5">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
