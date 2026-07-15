"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsProps {
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
  className?: string
  children: React.ReactNode
}

const TabsContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
}>({ value: "", onValueChange: () => {} })

function Tabs({
  value: controlledValue,
  onValueChange,
  defaultValue = "",
  className,
  children,
}: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const value = controlledValue ?? internalValue
  const handleChange = onValueChange ?? setInternalValue

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleChange }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  )
}

function TabsList({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "inline-flex h-12 items-center justify-center rounded-full bg-surface-elevated/40 border border-border/30 p-1 gap-1",
        className
      )}
    >
      {children}
    </div>
  )
}

function TabsTrigger({
  value,
  className,
  children,
}: {
  value: string
  className?: string
  children: React.ReactNode
}) {
  const context = React.useContext(TabsContext)
  const isActive = context.value === value

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-full px-5 py-2 text-[13px] font-medium transition-all duration-500 ease-out cursor-pointer flex-1",
        isActive
          ? "bg-accent text-background shadow-md shadow-accent/10"
          : "text-text-muted hover:text-text-secondary",
        className
      )}
      onClick={() => context.onValueChange(value)}
    >
      {children}
    </button>
  )
}

function TabsContent({
  value,
  className,
  children,
}: {
  value: string
  className?: string
  children: React.ReactNode
}) {
  const context = React.useContext(TabsContext)
  if (context.value !== value) return null

  return (
    <div className={cn("mt-6", className)} style={{ animation: "fade-in-up 0.6s ease-out" }}>
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
