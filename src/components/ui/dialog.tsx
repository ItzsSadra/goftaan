"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange?.(false)}
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="relative z-50" style={{ animation: "scale-in 0.5s ease-out" }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function DialogContent({
  className,
  children,
  onClose,
}: {
  className?: string
  children: React.ReactNode
  onClose?: () => void
}) {
  return (
    <div
      className={cn(
        "w-full max-w-lg rounded-[24px] border border-border/30 bg-surface/95 backdrop-blur-xl p-8 shadow-2xl shadow-black/30",
        className
      )}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute left-5 top-5 rounded-full p-2 text-text-muted hover:text-text-primary hover:bg-surface-elevated/50 transition-all duration-300 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {children}
    </div>
  )
}

function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-xl font-semibold text-text-primary tracking-tight", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-[14px] text-text-secondary leading-relaxed", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
}
