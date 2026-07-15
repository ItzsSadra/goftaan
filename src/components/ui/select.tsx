"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface SelectProps {
  value?: string
  onValueChange: (value: string) => void
  children: React.ReactNode
}

const SelectContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
}>({
  value: "",
  onValueChange: () => {},
  open: false,
  setOpen: () => {},
})

function Select({ value = "", onValueChange, children }: SelectProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <SelectContext.Provider
      value={{ value, onValueChange, open, setOpen }}
    >
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  )
}

function SelectTrigger({
  className,
  placeholder,
}: {
  className?: string
  placeholder?: string
}) {
  const { value, open, setOpen } = React.useContext(SelectContext)

  return (
    <button
      type="button"
      className={cn(
        "flex h-12 w-full items-center justify-between rounded-xl border border-border bg-background px-3.5 py-3 text-[15px] text-text-primary transition-colors hover:bg-surface focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent cursor-pointer",
        !value && "text-text-secondary",
        className
      )}
      onClick={() => setOpen(!open)}
    >
      <span>{value || placeholder || "Select..."}</span>
      <ChevronDown className={cn("h-4 w-4 text-text-muted transition-transform duration-200", open && "rotate-180")} />
    </button>
  )
}

function SelectContent({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const { open, setOpen } = React.useContext(SelectContext)

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={() => setOpen(false)}
      />
      <div
        className={cn(
          "absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-border bg-surface shadow-lg",
          className
        )}
      >
        {children}
      </div>
    </>
  )
}

function SelectItem({
  value,
  children,
}: {
  value: string
  children: React.ReactNode
}) {
  const { value: selected, onValueChange, setOpen } =
    React.useContext(SelectContext)

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center rounded-lg mx-1 px-3 py-2.5 text-[15px] cursor-pointer transition-colors text-text-primary hover:bg-background-accent",
        selected === value && "bg-accent-soft text-accent"
      )}
      onClick={() => {
        onValueChange(value)
        setOpen(false)
      }}
    >
      {children}
    </button>
  )
}

export { Select, SelectTrigger, SelectContent, SelectItem }
