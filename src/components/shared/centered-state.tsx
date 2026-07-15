import { cn } from "@/lib/utils"

interface CenteredStateProps {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export function CenteredState({
  title,
  description,
  action,
  icon,
  className,
}: CenteredStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 sm:py-24 px-6 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-5 text-text-muted/50 animate-in fade-in-up">{icon}</div>
      )}
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-text-muted max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-6 animate-in fade-in-up stagger-2">{action}</div>}
    </div>
  )
}
