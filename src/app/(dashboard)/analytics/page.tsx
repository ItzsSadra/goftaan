"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CenteredState } from "@/components/shared/centered-state"
import {
  CalendarDays,
  Clock,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react"

interface AnalyticsData {
  totalMeetings: number
  thisWeekMeetings: number
  summaryCoverage: number
  avgDuration: number
  totalKeyPoints: number
  overdueActions: number
  next7Days: { day: string; count: number }[]
}

export default function AnalyticsPage() {
  const [data, setData] = React.useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics")
      if (res.ok) {
        setData(await res.json())
      }
    } catch {
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
      </div>
    )
  }

  if (!data) {
    return (
      <CenteredState
        icon={BarChart3}
        title="داده‌ای موجود نیست"
        description="اطلاعات تحلیلی هنوز در دسترس نیست."
      />
    )
  }

  const metrics = [
    {
      icon: CalendarDays,
      label: "کل جلسات",
      value: data.totalMeetings,
      color: "text-accent",
      bg: "bg-accent-soft",
    },
    {
      icon: Clock,
      label: "میانگین مدت",
      value: `${data.avgDuration} دقیقه`,
      color: "text-success",
      bg: "bg-success-bg",
    },
    {
      icon: TrendingUp,
      label: "جلسات این هفته",
      value: data.thisWeekMeetings,
      color: "text-warning",
      bg: "bg-amber-50",
    },
    {
      icon: BarChart3,
      label: "نکات کلیدی",
      value: data.totalKeyPoints,
      color: "text-danger",
      bg: "bg-danger-bg",
    },
  ]

  return (
    <div className="flex flex-col gap-5 pb-4">
      {/* Hero */}
      <div className="rounded-[20px] bg-surface border border-border p-5 sm:p-6 flex flex-col gap-2">
        <p className="text-[13px] font-bold text-accent">تحلیل</p>
        <h1 className="text-[26px] sm:text-[30px] font-bold text-text-primary leading-10">
          آمار جلسات
        </h1>
        <p className="text-[14px] text-text-secondary leading-5">
          نمای کلی از جلسات شما
        </p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-[16px] bg-surface border border-border p-4 flex flex-col gap-3"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${m.bg}`}>
              <m.icon className={`h-4 w-4 ${m.color}`} />
            </div>
            <div>
              <p className="text-[22px] font-bold text-text-primary">{m.value}</p>
              <p className="text-[12px] text-text-secondary mt-0.5">{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Coverage & Overdue */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[16px] bg-success-bg border border-success-border p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <p className="text-[13px] font-bold text-success">پوشش خلاصه</p>
          </div>
          <p className="text-[22px] font-bold text-text-primary mt-2">{data.summaryCoverage}%</p>
          <p className="text-[12px] text-text-secondary mt-0.5">جلسات دارای خلاصه</p>
        </div>
        <div className="rounded-[16px] bg-danger-bg border border-danger-border p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-danger" />
            <p className="text-[13px] font-bold text-danger">وظایف باقی‌مانده</p>
          </div>
          <p className="text-[22px] font-bold text-text-primary mt-2">{data.overdueActions}</p>
          <p className="text-[12px] text-text-secondary mt-0.5">آیتم انجام نشده</p>
        </div>
      </div>

      {/* 7-day chart */}
      {data.next7Days && data.next7Days.length > 0 && (
        <Card>
          <CardContent className="pt-1">
            <p className="text-[14px] font-bold text-text-primary mb-4">جلسات ۷ روز آینده</p>
            <div className="flex items-end gap-2 h-32">
              {data.next7Days.map((day, i) => {
                const maxCount = Math.max(...data.next7Days.map((d) => d.count), 1)
                const height = (day.count / maxCount) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[11px] font-bold text-text-secondary">{day.count}</span>
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className="w-full rounded-t-lg bg-accent transition-all duration-300"
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-text-muted">{day.day}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
