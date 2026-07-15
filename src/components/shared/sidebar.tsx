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
} from "lucide-react"

const navItems = [
  {
    href: "/meetings",
    label: "جلسه\u200cها",
    labelEn: "Meetings",
    icon: CalendarDays,
  },
  {
    href: "/analytics",
    label: "تحلیل",
    labelEn: "Analytics",
    icon: BarChart3,
  },
  {
    href: "/settings",
    label: "تنظیمات",
    labelEn: "Settings",
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

  const navContent = (
    <>
      <div className="flex items-center gap-3 px-4 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
          <Mic className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">گفتان</h1>
          <p className="text-xs text-gray-500">مدیریت هوشمند جلسات</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive(item.href)
                ? "bg-indigo-50 text-indigo-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <item.icon
              className={cn(
                "h-5 w-5",
                isActive(item.href)
                  ? "text-indigo-600"
                  : "text-gray-400"
              )}
            />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
        >
          <LogOut className="h-5 w-5" />
          <span>خروج</span>
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-l-0 lg:border-r border-gray-200 bg-white h-screen sticky top-0">
        {navContent}
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors rounded-lg",
                isActive(item.href)
                  ? "text-indigo-600"
                  : "text-gray-500"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5",
                  isActive(item.href)
                    ? "text-indigo-600"
                    : "text-gray-400"
                )}
              />
              <span>{item.label}</span>
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
            <span>خروج</span>
          </button>
        </div>
      </nav>
    </>
  )
}
