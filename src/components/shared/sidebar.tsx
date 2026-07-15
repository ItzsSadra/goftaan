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
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:border-l lg:border-border bg-background h-screen sticky top-0">
        <div className="flex items-center gap-3 px-6 py-7">
          <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-accent text-white font-bold text-xl">
            G
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-text-primary">گفتان</h1>
            <p className="text-[13px] text-text-secondary">مدیریت هوشمند جلسات</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-all duration-200",
                isActive(item.href)
                  ? "bg-accent-soft text-accent"
                  : "text-text-secondary hover:bg-background-accent hover:text-text-primary"
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

        <div className="px-3 pb-5 space-y-2">
          <Link href="/meetings/new">
            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent text-white px-4 py-3 text-[14px] font-bold hover:bg-accent-dark transition-all duration-200 active:scale-[0.99] active:opacity-90 cursor-pointer">
              + جلسه جدید
            </button>
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-[14px] font-bold text-danger hover:bg-danger/10 transition-all duration-200 cursor-pointer"
          >
            <LogOut className="h-[18px] w-[18px]" />
            <span>خروج</span>
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50 safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-1.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-1.5 text-[11px] font-bold transition-colors duration-200 rounded-xl min-w-[64px]",
                isActive(item.href)
                  ? "text-accent-dark"
                  : "text-text-secondary"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-all duration-200",
                  isActive(item.href) && "scale-110"
                )}
              />
              <span>{item.label}</span>
            </Link>
          ))}
          <Link
            href="/meetings/new"
            className="flex flex-col items-center gap-1 px-4 py-1.5 text-[11px] font-bold text-text-secondary min-w-[64px]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white text-lg font-bold">
              +
            </div>
          </Link>
        </div>
      </nav>
    </>
  )
}
