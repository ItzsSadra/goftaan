"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CenteredState } from "@/components/shared/centered-state"
import {
  ArrowRight,
  Clock,
  CalendarDays,
  MapPin,
  FileText,
  CheckCircle2,
  Pencil,
  Trash2,
  Loader2,
  Download,
} from "lucide-react"

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

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const weekDays = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"]
  return `${weekDays[d.getDay()]} ${d.getDate()} ${d.toLocaleDateString("fa-IR", { month: "long" })} ${d.getFullYear()}`
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getDuration(startAt: string, endAt: string) {
  const ms = new Date(endAt).getTime() - new Date(startAt).getTime()
  return Math.round(ms / 60000)
}

export default function MeetingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [meeting, setMeeting] = React.useState<Meeting | null>(null)
  const [summary, setSummary] = React.useState<Summary | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [deleting, setDeleting] = React.useState(false)

  React.useEffect(() => {
    fetchMeeting()
  }, [id])

  const fetchMeeting = async () => {
    try {
      const res = await fetch(`/api/meetings/${id}`)
      if (res.ok) {
        const data = await res.json()
        setMeeting(data.meeting)
        setSummary(data.summary)
      }
    } catch {
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/meetings/${id}`, { method: "DELETE" })
      if (res.ok) router.push("/meetings")
    } catch {
      setDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
      </div>
    )
  }

  if (!meeting) {
    return (
      <CenteredState
        icon={CalendarDays}
        title="جلسه یافت نشد"
        description="این جلسه ممکن است حذف شده باشد."
        action={
          <Button onClick={() => router.push("/meetings")}>
            بازگشت به لیست
          </Button>
        }
      />
    )
  }

  const isPast = new Date(meeting.endAt) < new Date()

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-background-accent transition-colors cursor-pointer"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[20px] font-bold text-text-primary truncate">{meeting.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={isPast ? "secondary" : "default"}>
              {isPast ? "برگزار شده" : "پیش رو"}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/meetings/${id}/edit`)}
          >
            <Pencil className="h-3.5 w-3.5 ml-1" />
            ویرایش
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-[14px] bg-surface border border-border p-3 flex flex-col items-center gap-1.5">
          <CalendarDays className="h-4 w-4 text-text-muted" />
          <span className="text-[12px] text-text-secondary">{formatDate(meeting.startAt)}</span>
        </div>
        <div className="rounded-[14px] bg-surface border border-border p-3 flex flex-col items-center gap-1.5">
          <Clock className="h-4 w-4 text-text-muted" />
          <span className="text-[12px] text-text-secondary">
            {formatTime(meeting.startAt)} – {formatTime(meeting.endAt)}
          </span>
        </div>
        <div className="rounded-[14px] bg-surface border border-border p-3 flex flex-col items-center gap-1.5">
          <Clock className="h-4 w-4 text-text-muted" />
          <span className="text-[12px] text-text-secondary">{getDuration(meeting.startAt, meeting.endAt)} دقیقه</span>
        </div>
      </div>

      {/* Location */}
      {meeting.location && (
        <div className="rounded-[14px] bg-surface border border-border p-4 flex items-center gap-3">
          <MapPin className="h-4 w-4 text-text-muted" />
          <span className="text-[14px] text-text-primary">{meeting.location}</span>
        </div>
      )}

      {/* Notes */}
      {meeting.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[15px]">
              <FileText className="h-4 w-4 text-accent" />
              یادداشت‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[14px] text-text-primary leading-7 whitespace-pre-line">{meeting.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {summary?.summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[15px]">
              <FileText className="h-4 w-4 text-accent" />
              خلاصه جلسه
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[14px] text-text-primary leading-7 whitespace-pre-line">{summary.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Key Points */}
      {summary?.keyPoints && summary.keyPoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[15px]">
              <CheckCircle2 className="h-4 w-4 text-success" />
              نکات کلیدی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-[14px] text-text-primary">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-success shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Action Items */}
      {summary?.actionItems && summary.actionItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[15px]">
              <Pencil className="h-4 w-4 text-warning" />
              وظایف
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.actionItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-[14px] text-text-primary">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-warning shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Transcript */}
      {summary?.transcript && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-[15px]">
              <FileText className="h-4 w-4 text-text-muted" />
              متن کامل جلسه
            </CardTitle>
            <a href={`/api/meetings/${id}/transcript`} download>
              <Button variant="outline" size="sm">
                <Download className="h-3.5 w-3.5 ml-1" />
                دانلود
              </Button>
            </a>
          </CardHeader>
          <CardContent>
            <div className="max-h-60 overflow-auto rounded-xl bg-background p-4 border border-border">
              <p className="text-[13px] text-text-secondary leading-6 whitespace-pre-line font-mono">
                {summary.transcript}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
