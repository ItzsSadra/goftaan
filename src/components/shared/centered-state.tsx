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
        "flex flex-col items-center justify-center py-20 sm:py-32 px-6 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mb-6">
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full bg-surface-elevated/40",
              variant === "error" && "bg-danger-bg"
            )}
          >
            <Icon
              className={cn(
                "h-7 w-7 text-text-muted",
                variant === "error" && "text-danger"
              )}
            />
          </div>
        </div>
      )}
      <h3 className="text-[18px] font-semibold text-text-primary tracking-tight">{title}</h3>
      {description && (
        <p className="mt-2.5 text-[14px] text-text-muted max-w-xs leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-8">{action}</div>}
    </div>
  )
}
