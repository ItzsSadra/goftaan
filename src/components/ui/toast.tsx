"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { CheckCircle2, Info, XCircle } from "lucide-react"

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
      }, 5000)
    },
    []
  )

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
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
    default: <Info className="h-4 w-4 text-indigo-500" />,
    destructive: <XCircle className="h-4 w-4 text-red-500" />,
    success: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border bg-white p-4 shadow-lg animate-in slide-in-from-right-full duration-300",
        toast.variant === "destructive" && "border-red-200",
        toast.variant === "success" && "border-emerald-200"
      )}
    >
      {icons[toast.variant || "default"]}
      <div className="flex-1">
        {toast.title && (
          <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
        )}
        {toast.description && (
          <p className="text-sm text-gray-500 mt-0.5">{toast.description}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-gray-400 hover:text-gray-600 cursor-pointer"
      >
        <XCircle className="h-4 w-4" />
      </button>
    </div>
  )
}

export { ToastItem }
