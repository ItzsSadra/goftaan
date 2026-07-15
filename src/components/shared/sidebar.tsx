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
  Plus,
} from "lucide-react"

const navItems = [
  {
    href: "/meetings",
    label: "جلسه\u200cها",
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
      <aside className="hidden lg:flex lg:flex-col lg:w-[260px] lg:border-l lg:border-border/30 bg-background-warm h-screen sticky top-0">
        <div className="flex items-center gap-3 px-7 py-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent font-semibold text-[15px] tracking-tight">
            گ
          </div>
          <div>
            <h1 className="text-[16px] font-semibold text-text-primary tracking-tight">گفتان</h1>
            <p className="text-[12px] text-text-muted tracking-wide">مدیریت جلسات</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-1 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-full px-4 py-2.5 text-[14px] font-medium transition-all duration-500 ease-out",
                isActive(item.href)
                  ? "bg-accent/8 text-accent"
                  : "text-text-muted hover:bg-surface-elevated/40 hover:text-text-secondary"
              )}
            >
              <item.icon
                className={cn(
                  "h-[18px] w-[18px]",
                  isActive(item.href)
                    ? "text-accent"
                    : "text-text-muted"
                )}
              />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="px-4 pb-6 space-y-3">
          <Link href="/meetings/new">
            <button className="flex w-full items-center justify-center gap-2.5 rounded-full bg-accent text-background px-4 py-3 text-[14px] font-medium hover:bg-accent-dark hover:shadow-lg hover:shadow-accent/10 transition-all duration-500 ease-out active:scale-[0.98] cursor-pointer">
              <Plus className="h-4 w-4" />
              جلسه جدید
            </button>
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-[13px] font-medium text-text-muted hover:text-text-secondary hover:bg-surface-elevated/30 transition-all duration-500 cursor-pointer"
          >
            <LogOut className="h-[16px] w-[16px]" />
            <span>خروج</span>
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/20 z-50 safe-area-bottom">
        <div className="flex items-center justify-around px-3 py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-1.5 text-[11px] font-medium transition-all duration-500 rounded-2xl min-w-[60px]",
                isActive(item.href)
                  ? "text-accent"
                  : "text-text-muted"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-all duration-500",
                  isActive(item.href) && "scale-105"
                )}
              />
              <span>{item.label}</span>
            </Link>
          ))}
          <Link
            href="/meetings/new"
            className="flex flex-col items-center gap-1 px-4 py-1.5 text-[11px] font-medium text-text-muted min-w-[60px]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent text-lg font-medium">
              +
            </div>
          </Link>
        </div>
      </nav>
    </>
  )
}
