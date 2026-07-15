"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  CalendarDays,
  BarChart3,
  Settings,
  LogOut,
  Mic,
  Plus,
} from "lucide-react"

const navItems = [
  {
    href: "/meetings",
    label: "جلسه‌ها",
    icon: CalendarDays,
  },
  {
    href: "/analytics",
    label: "تحلیل",
    icon: BarChart3,
  },
  {
    href: "/settings",
    label: "تنظیمات",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  const isActive = (href: string) => pathname.startsWith(href)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:border-l lg:border-border bg-surface/50 backdrop-blur-xl h-screen sticky top-0">
        <div className="flex items-center gap-3 px-6 py-7">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 border border-accent/20">
            <Mic className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary tracking-tight">گفتان</h1>
            <p className="text-[11px] text-text-muted">مدیریت هوشمند جلسات</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive(item.href)
                  ? "bg-accent/10 text-accent border border-accent/15"
                  : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5",
                  isActive(item.href)
                    ? "text-accent"
                    : "text-text-muted"
                )}
              />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="px-4 pb-6 space-y-2">
          <Link href="/meetings/new">
            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent text-white px-4 py-3 text-sm font-medium shadow-lg shadow-accent/20 hover:bg-accent-dark hover:shadow-xl hover:shadow-accent/25 transition-all duration-200 active:scale-[0.97] cursor-pointer">
              <Plus className="h-4 w-4" />
              جلسه جدید
            </button>
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-text-muted hover:bg-danger/10 hover:text-danger transition-all duration-200 cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
            <span>خروج</span>
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass border-t border-border z-50 safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 text-[10px] font-medium transition-all duration-200 rounded-xl min-w-[64px]",
                isActive(item.href)
                  ? "text-accent"
                  : "text-text-muted active:text-text-primary"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isActive(item.href) && "scale-110"
                )}
              />
              <span>{item.label}</span>
            </Link>
          ))}
          <Link
            href="/meetings/new"
            className="flex flex-col items-center gap-1 px-4 py-2 text-[10px] font-medium text-text-muted min-w-[64px]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent shadow-lg shadow-accent/25">
              <Plus className="h-4 w-4 text-white" />
            </div>
          </Link>
        </div>
      </nav>
    </>
  )
}
