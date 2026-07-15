"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MeetingCard } from "@/components/meetings/meeting-card"
import { CenteredState } from "@/components/shared/centered-state"
import { useMeetings } from "@/hooks/use-meetings"
import { useToast } from "@/components/ui/toast"
import {
  CalendarDays,
  Plus,
  RefreshCw,
  Loader2,
  CalendarOff,
} from "lucide-react"
import Link from "next/link"

export default function MeetingsPage() {
  const { upcoming, past, summaries, isLoading, error, refresh, deleteMeeting } =
    useMeetings()
  const { toast } = useToast()
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refresh()
    setIsRefreshing(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm("آیا از حذف این جلسه اطمینان دارید؟")) {
      await deleteMeeting(id)
      toast({ title: "جلسه حذف شد", variant: "success" })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  if (error) {
    return (
      <CenteredState
        title="خطا در بارگذاری"
        description={error}
        icon={<CalendarOff className="h-16 w-16" />}
        action={
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 ml-2" />
            تلاش مجدد
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-in fade-in-up">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            جلسه‌ها
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {upcoming.length + past.length} جلسه
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
          <Link href="/meetings/new" className="hidden sm:block">
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              جلسه جدید
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="animate-in fade-in-up stagger-1">
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">
              پیش رو ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              گذشته ({past.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {upcoming.length === 0 ? (
              <CenteredState
                title="جلسه‌ای پیش رو نیست"
                description="با کلیک روی دکمه زیر یک جلسه جدید اضافه کنید"
                icon={<CalendarDays className="h-16 w-16" />}
                action={
                  <Link href="/meetings/new">
                    <Button>
                      <Plus className="h-4 w-4 ml-2" />
                      افزودن جلسه
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {upcoming.map((meeting, i) => (
                  <div key={meeting.id} className={`animate-in fade-in-up stagger-${Math.min(i + 1, 6)}`}>
                    <MeetingCard
                      meeting={meeting}
                      onDelete={handleDelete}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {past.length === 0 ? (
              <CenteredState
                title="جلسه گذشته‌ای وجود ندارد"
                description="جلسات گذشته اینجا نمایش داده می‌شوند"
                icon={<CalendarDays className="h-16 w-16" />}
              />
            ) : (
              <div className="space-y-3">
                {past.map((meeting, i) => (
                  <div key={meeting.id} className={`animate-in fade-in-up stagger-${Math.min(i + 1, 6)}`}>
                    <MeetingCard
                      meeting={meeting}
                      summary={summaries[meeting.id]}
                      onDelete={handleDelete}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
