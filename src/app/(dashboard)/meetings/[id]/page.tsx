"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import { formatMeetingTime } from "@/lib/utils"
import type { Meeting, MeetingSummary } from "@/types"
import {
  ArrowRight,
  Mic,
  MapPin,
  Clock,
  FileText,
  Trash2,
  Loader2,
  Key,
  Zap,
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"

export default function MeetingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const meetingId = params.id as string

  const [meeting, setMeeting] = React.useState<Meeting | null>(null)
  const [summary, setSummary] = React.useState<MeetingSummary | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isDeleting, setIsDeleting] = React.useState(false)

  React.useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/meetings/${meetingId}`)
        if (!res.ok) throw new Error("Failed to load meeting")
        const data = await res.json()
        if (data.meeting) setMeeting(data.meeting)
        if (data.summary) setSummary(data.summary)
      } catch {
        // Failed to load
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [meetingId])

  const handleDelete = async () => {
    if (!confirm("آیا از حذف این جلسه اطمینان دارید؟")) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete")

      toast({ title: "جلسه حذف شد", variant: "success" })
      router.push("/meetings")
    } catch {
      toast({ title: "خطا در حذف جلسه", variant: "destructive" })
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="text-center py-24">
        <p className="text-text-muted">جلسه یافت نشد</p>
        <Button variant="ghost" onClick={() => router.push("/meetings")} className="mt-4">
          بازگشت
        </Button>
      </div>
    )
  }

  const now = new Date()
  const isPast = new Date(meeting.endAt) < now

  return (
    <div className="max-w-lg mx-auto space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 animate-in fade-in-up">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight truncate">
            {meeting.title}
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge
              variant={
                isPast
                  ? "secondary"
                  : meeting.source === "manual"
                    ? "success"
                    : "default"
              }
            >
              {isPast ? "گذشته" : meeting.source === "manual" ? "دستی" : "تقویم"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Meeting Info */}
      <Card className="animate-in fade-in-up stagger-1">
        <CardContent className="p-5 sm:p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-sm text-text-secondary">
              <Clock className="h-4 w-4 shrink-0 text-text-muted" />
              <span>{formatMeetingTime(meeting.startAt, meeting.endAt)}</span>
            </div>
            {meeting.location && (
              <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                <MapPin className="h-4 w-4 shrink-0 text-text-muted" />
                <span>{meeting.location}</span>
              </div>
            )}
            {meeting.notes && (
              <div className="flex items-start gap-2.5 text-sm text-text-secondary">
                <FileText className="h-4 w-4 shrink-0 mt-0.5 text-text-muted" />
                <span className="whitespace-pre-wrap leading-relaxed">{meeting.notes}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recording */}
      {!isPast && (
        <Card className="animate-in fade-in-up stagger-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 border border-accent/20">
                <Mic className="h-4 w-4 text-accent" />
              </div>
              <span>ضبط صدا</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-muted mb-5 leading-relaxed">
              صدای جلسه را ضبط کنید تا با هوش مصنوعی تبدیل به متن و خلاصه شود.
            </p>
            <Link href={`/meetings/${meetingId}/recording`}>
              <Button className="w-full" size="lg">
                <Mic className="h-4 w-4 ml-2" />
                شروع ضبط
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* AI Summary */}
      {summary && (
        <Card className="animate-in fade-in-up stagger-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning/15 border border-warning/20">
                <Zap className="h-4 w-4 text-warning" />
              </div>
              <span>خلاصه هوشمند</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {summary.transcript && (
              <div>
                <h4 className="text-xs font-semibold text-text-muted mb-2.5 uppercase tracking-wider">
                  متن پیاده‌شده
                </h4>
                <div className="p-4 rounded-xl bg-surface-elevated/50 border border-border text-sm text-text-secondary max-h-40 overflow-y-auto leading-relaxed">
                  {summary.transcript}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-xs font-semibold text-text-muted mb-2.5 uppercase tracking-wider">
                خلاصه
              </h4>
              <p className="text-sm text-text-secondary leading-relaxed">
                {summary.summary}
              </p>
            </div>

            {summary.keyPoints.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-text-muted mb-3 uppercase tracking-wider flex items-center gap-2">
                  <Key className="h-3.5 w-3.5 text-accent" />
                  نکات کلیدی
                </h4>
                <ul className="space-y-2">
                  {summary.keyPoints.map((point, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-text-secondary"
                    >
                      <span className="text-accent mt-1.5 text-xs">●</span>
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.actionItems.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-text-muted mb-3 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-warning" />
                  اقدام‌ها
                </h4>
                <ul className="space-y-2">
                  {summary.actionItems.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-text-secondary"
                    >
                      <span className="text-warning mt-1.5 text-xs">●</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete */}
      {meeting.source === "manual" && (
        <Card className="border-danger/20 animate-in fade-in-up stagger-4">
          <CardContent className="p-5 sm:p-6">
            <Button
              variant="destructive"
              className="w-full"
              size="lg"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف جلسه
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
