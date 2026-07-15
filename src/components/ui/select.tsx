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
        "flex h-12 w-full items-center justify-between rounded-full border border-border/50 bg-surface-elevated/30 px-5 py-3 text-[15px] text-text-primary transition-all duration-500 hover:bg-surface-elevated/50 focus:outline-none focus:border-accent/30 focus:bg-surface-elevated/50 cursor-pointer",
        !value && "text-text-muted/60",
        className
      )}
      onClick={() => setOpen(!open)}
    >
      <span>{value || placeholder || "Select..."}</span>
      <ChevronDown className={cn("h-4 w-4 text-text-muted transition-transform duration-500", open && "rotate-180")} />
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
          "absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-[20px] border border-border/30 bg-surface/95 backdrop-blur-xl shadow-2xl shadow-black/20",
          className
        )}
        style={{ animation: "scale-in 0.4s ease-out" }}
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
        "flex w-full items-center rounded-xl mx-1 px-4 py-3 text-[15px] cursor-pointer transition-all duration-300 text-text-secondary hover:bg-surface-elevated/60 hover:text-text-primary",
        selected === value && "bg-accent/8 text-accent"
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
