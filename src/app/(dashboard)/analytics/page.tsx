"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import {
  CalendarDays,
  TrendingUp,
  FileText,
  Clock,
  Key,
  AlertTriangle,
  RefreshCw,
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
  const { toast } = useToast()
  const [data, setData] = React.useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const loadData = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/analytics")
      if (!res.ok) throw new Error("Failed to load analytics")
      const json = await res.json()
      setData(json)
    } catch {
      toast({ title: "خطا در بارگذاری", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  const maxCount = Math.max(...data.next7Days.map((d) => d.count), 1)

  const metrics = [
    {
      title: "کل جلسه‌ها",
      value: data.totalMeetings,
      icon: CalendarDays,
      color: "text-accent",
      bg: "bg-accent/10",
      border: "border-accent/15",
    },
    {
      title: "جلسه این هفته",
      value: data.thisWeekMeetings,
      icon: TrendingUp,
      color: "text-success",
      bg: "bg-success/10",
      border: "border-success/15",
    },
    {
      title: "پوشش خلاصه",
      value: `${data.summaryCoverage}%`,
      icon: FileText,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      border: "border-purple-400/15",
    },
    {
      title: "میانگین دقیقه",
      value: data.avgDuration,
      icon: Clock,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-400/15",
    },
    {
      title: "نکات کلیدی",
      value: data.totalKeyPoints,
      icon: Key,
      color: "text-warning",
      bg: "bg-warning/10",
      border: "border-warning/15",
    },
    {
      title: "اقدام معوق",
      value: data.overdueActions,
      icon: AlertTriangle,
      color: data.overdueActions > 0 ? "text-danger" : "text-text-muted",
      bg: data.overdueActions > 0 ? "bg-danger/10" : "bg-surface-elevated",
      border: data.overdueActions > 0 ? "border-danger/15" : "border-border",
    },
  ]

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between animate-in fade-in-up">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
          تحلیل
        </h1>
        <Button variant="ghost" size="icon" onClick={loadData}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 animate-in fade-in-up stagger-1">
        {metrics.map((metric, i) => (
          <Card key={metric.title} className={`animate-in fade-in-up stagger-${Math.min(i + 2, 6)}`}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${metric.bg} border ${metric.border}`}>
                  <metric.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${metric.color}`} />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-text-primary">
                    {metric.value}
                  </p>
                  <p className="text-[11px] text-text-muted">{metric.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bar chart */}
      <Card className="animate-in fade-in-up stagger-4">
        <CardHeader>
          <CardTitle className="text-base">جلسه‌های ۷ روز آینده</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-40 sm:h-48">
            {data.next7Days.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full flex justify-center h-full items-end">
                  <div
                    className="w-full max-w-[36px] sm:max-w-[44px] bg-gradient-to-t from-accent/60 to-accent rounded-t-lg transition-all duration-500"
                    style={{
                      height: `${(day.count / maxCount) * 100}%`,
                      minHeight: day.count > 0 ? "8px" : "3px",
                    }}
                  />
                </div>
                <span className="text-[10px] sm:text-xs text-text-muted">{day.day}</span>
                <span className="text-[10px] sm:text-xs font-medium text-text-secondary">
                  {day.count}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
