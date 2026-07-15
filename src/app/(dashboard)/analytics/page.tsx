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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  const maxCount = Math.max(...data.next7Days.map((d) => d.count), 1)

  const metrics = [
    {
      title: "کل جلسه‌ها",
      value: data.totalMeetings,
      icon: CalendarDays,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "جلسه این هفته",
      value: data.thisWeekMeetings,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "پوشش خلاصه",
      value: `${data.summaryCoverage}%`,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "میانگین دقیقه",
      value: data.avgDuration,
      icon: Clock,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "نکات کلیدی",
      value: data.totalKeyPoints,
      icon: Key,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "اقدام معوق",
      value: data.overdueActions,
      icon: AlertTriangle,
      color: data.overdueActions > 0 ? "text-red-600" : "text-gray-400",
      bg: data.overdueActions > 0 ? "bg-red-50" : "bg-gray-50",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">تحلیل</h1>
        <Button variant="ghost" size="icon" onClick={loadData}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${metric.bg}`}>
                  <metric.icon className={`h-5 w-5 ${metric.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {metric.value}
                  </p>
                  <p className="text-xs text-gray-500">{metric.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">جلسه‌های ۷ روز آینده</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-40">
            {data.next7Days.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex justify-center">
                  <div
                    className="w-full max-w-[40px] bg-indigo-500 rounded-t-md transition-all duration-300"
                    style={{
                      height: `${(day.count / maxCount) * 100}%`,
                      minHeight: day.count > 0 ? "8px" : "2px",
                    }}
                  />
                </div>
                <span className="text-xs text-gray-500">{day.day}</span>
                <span className="text-xs font-medium text-gray-700">
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
