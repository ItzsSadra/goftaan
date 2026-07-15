"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { CheckCircle2, Info, XCircle, X } from "lucide-react"

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive" | "success"
}

interface ToastContextType {
  toast: (props: Omit<Toast, "id">) => void
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType>({
  toast: () => {},
  dismiss: () => {},
})

export function useToast() {
  return React.useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const toast = React.useCallback(
    (props: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [...prev, { ...props, id }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 4000)
    },
    []
  )

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed bottom-24 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-6 z-[100] flex flex-col gap-2.5 max-w-sm lg:max-w-md pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast
  onDismiss: () => void
}) {
  const icons = {
    default: <Info className="h-4 w-4 text-accent" />,
    destructive: <XCircle className="h-4 w-4 text-danger" />,
    success: <CheckCircle2 className="h-4 w-4 text-success" />,
  }

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-[16px] border border-border bg-surface p-4 shadow-lg",
        toast.variant === "destructive" && "border-danger-border bg-danger-bg",
        toast.variant === "success" && "border-success-border bg-success-bg"
      )}
    >
      <div className="mt-0.5 shrink-0">{icons[toast.variant || "default"]}</div>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-bold text-text-primary">{toast.title}</p>
        )}
        {toast.description && (
          <p className="text-sm text-text-secondary mt-0.5 leading-relaxed">{toast.description}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0 mt-0.5"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export { ToastItem }
