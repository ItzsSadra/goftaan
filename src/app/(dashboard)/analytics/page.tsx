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
        title="داده\u200cای موجود نیست"
        description="اطلاعات تحلیلی هنوز در دسترس نیست."
      />
    )
  }

  const metrics = [
    {
      icon: CalendarDays,
      label: "کل جلسات",
      value: data.totalMeetings,
      accent: "text-accent",
    },
    {
      icon: Clock,
      label: "میانگین مدت",
      value: `${data.avgDuration} دقیقه`,
      accent: "text-success",
    },
    {
      icon: TrendingUp,
      label: "جلسات این هفته",
      value: data.thisWeekMeetings,
      accent: "text-warning",
    },
    {
      icon: BarChart3,
      label: "نکات کلیدی",
      value: data.totalKeyPoints,
      accent: "text-danger",
    },
  ]

  return (
    <div className="flex flex-col gap-8 pb-4">
      {/* Hero */}
      <div className="flex flex-col gap-3">
        <p className="text-[12px] font-medium text-accent tracking-[0.15em] uppercase">تحلیل</p>
        <h1 className="text-[32px] sm:text-[38px] font-semibold text-text-primary leading-tight tracking-tight">
          آمار جلسات
        </h1>
        <p className="text-[15px] text-text-muted leading-relaxed">
          نمای کلی از جلسات شما
        </p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-[20px] bg-surface/50 border border-border/30 p-5 flex flex-col gap-4"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-surface-elevated/40`}>
              <m.icon className={`h-[18px] w-[18px] ${m.accent} opacity-70`} />
            </div>
            <div>
              <p className="text-[26px] font-semibold text-text-primary tracking-tight">{m.value}</p>
              <p className="text-[12px] text-text-muted mt-1 tracking-wide">{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Coverage & Overdue */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-[20px] bg-success/[0.03] border border-success/10 p-5">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-success/60" />
            <p className="text-[12px] font-medium text-success/70 tracking-wide">پوشش خلاصه</p>
          </div>
          <p className="text-[28px] font-semibold text-text-primary mt-3 tracking-tight">{data.summaryCoverage}%</p>
          <p className="text-[12px] text-text-muted mt-1">جلسات دارای خلاصه</p>
        </div>
        <div className="rounded-[20px] bg-danger/[0.03] border border-danger/10 p-5">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-danger/60" />
            <p className="text-[12px] font-medium text-danger/70 tracking-wide">وظایف باقی\u200cمانده</p>
          </div>
          <p className="text-[28px] font-semibold text-text-primary mt-3 tracking-tight">{data.overdueActions}</p>
          <p className="text-[12px] text-text-muted mt-1">آیتم انجام نشده</p>
        </div>
      </div>

      {/* 7-day chart */}
      {data.next7Days && data.next7Days.length > 0 && (
        <Card>
          <CardContent className="pt-2">
            <p className="text-[15px] font-medium text-text-primary mb-6">جلسات ۷ روز آینده</p>
            <div className="flex items-end gap-3 h-36">
              {data.next7Days.map((day, i) => {
                const maxCount = Math.max(...data.next7Days.map((d) => d.count), 1)
                const height = (day.count / maxCount) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[11px] font-medium text-text-muted">{day.count}</span>
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className="w-full rounded-full bg-accent/20 transition-all duration-700 ease-out"
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-text-muted/50 tracking-wide">{day.day}</span>
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
