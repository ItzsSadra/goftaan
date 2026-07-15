"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MeetingCard } from "@/components/meetings/meeting-card"
import { CenteredState } from "@/components/shared/centered-state"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { CalendarDays, Plus, Loader2 } from "lucide-react"

interface Meeting {
  id: string
  title: string
  location: string
  notes: string
  startAt: string
  endAt: string
  source: string
  createdAt: string
}

interface Summary {
  id: string
  meetingId: string
  transcript: string
  summary: string
  keyPoints: string[]
  actionItems: string[]
  createdAt: string
}

export default function MeetingsPage() {
  const router = useRouter()
  const [upcoming, setUpcoming] = React.useState<Meeting[]>([])
  const [past, setPast] = React.useState<Meeting[]>([])
  const [summaries, setSummaries] = React.useState<Record<string, Summary>>({})
  const [isLoading, setIsLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState("all")

  React.useEffect(() => {
    fetchMeetings()
  }, [])

  const fetchMeetings = async () => {
    try {
      const res = await fetch("/api/meetings")
      if (res.ok) {
        const data = await res.json()
        setUpcoming(data.upcoming || [])
        setPast(data.past || [])
        setSummaries(data.summaries || {})
      }
    } catch {
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/meetings/${id}`, { method: "DELETE" })
      if (res.ok) {
        setUpcoming((prev) => prev.filter((m) => m.id !== id))
        setPast((prev) => prev.filter((m) => m.id !== id))
      }
    } catch {
    }
  }

  const allMeetings = [...upcoming, ...past]

  const filtered = (() => {
    switch (activeTab) {
      case "upcoming":
        return upcoming
      case "past":
        return past
      default:
        return allMeetings
    }
  })()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      {/* Hero card */}
      <div className="rounded-[20px] bg-surface border border-border p-5 sm:p-6 flex flex-col gap-2">
        <p className="text-[13px] font-bold text-accent">جلسات من</p>
        <h1 className="text-[26px] sm:text-[30px] font-bold text-text-primary leading-10">
          لیست جلسات
        </h1>
        <p className="text-[14px] text-text-secondary leading-5">
          {allMeetings.length > 0
            ? `${allMeetings.length} جلسه ثبت شده`
            : "هنوز جلسه‌ای ثبت نشده"}
        </p>
      </div>

      {/* Tabs + Filter */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">همه</TabsTrigger>
            <TabsTrigger value="upcoming">پیش رو</TabsTrigger>
            <TabsTrigger value="past">برگزار شده</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab}>
          {filtered.length === 0 ? (
            <CenteredState
              icon={CalendarDays}
              title={activeTab === "all" ? "جلسه‌ای وجود ندارد" : "جلسه‌ای در این دسته نیست"}
              description="اولین جلسه خود را اضافه کنید."
              action={
                <Button onClick={() => router.push("/meetings/new")}>
                  <Plus className="h-4 w-4 ml-1" />
                  اضافه کردن جلسه
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-3 mt-4">
              {filtered.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  summary={summaries[meeting.id]}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* FAB */}
      <button
        onClick={() => router.push("/meetings/new")}
        className="fixed bottom-24 lg:bottom-8 left-4 sm:left-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg hover:bg-accent-dark transition-all duration-200 active:scale-95 cursor-pointer"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  )
}
