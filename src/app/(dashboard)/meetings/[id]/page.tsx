"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import { formatMeetingTime, formatDuration } from "@/lib/utils"
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
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import Link from "next/link"

export default function MeetingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const meetingId = params.id as string

  const [meeting, setMeeting] = React.useState<Meeting | null>(null)
  const [summaries, setSummaries] = React.useState<MeetingSummary[]>([])
  const [expandedId, setExpandedId] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isDeleting, setIsDeleting] = React.useState(false)

  React.useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/meetings/${meetingId}`)
        if (!res.ok) throw new Error("Failed to load meeting")
        const data = await res.json()
        if (data.meeting) setMeeting(data.meeting)
        if (data.summaries) setSummaries(data.summaries)
      } catch {
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
      const response = await fetch(`/api/meetings/${meetingId}`, { method: "DELETE" })
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
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="text-center py-32">
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
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4" style={{ animation: "fade-in-up 0.6s ease-out" }}>
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[24px] sm:text-[28px] font-semibold text-text-primary tracking-tight truncate">
            {meeting.title}
          </h1>
          <div className="flex items-center gap-2.5 mt-2">
            <Badge
              variant={
                isPast ? "secondary" : meeting.source === "manual" ? "success" : "default"
              }
            >
              {isPast ? "گذشته" : meeting.source === "manual" ? "دستی" : "تقویم"}
            </Badge>
            {summaries.length > 0 && (
              <Badge variant="outline">
                {summaries.length} ضبط
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Meeting Info */}
      <Card style={{ animation: "fade-in-up 0.6s ease-out 0.1s both" }}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-[14px] text-text-secondary">
              <Clock className="h-4 w-4 shrink-0 text-text-muted/50" />
              <span>{formatMeetingTime(meeting.startAt, meeting.endAt)}</span>
            </div>
            {meeting.location && (
              <div className="flex items-center gap-3 text-[14px] text-text-secondary">
                <MapPin className="h-4 w-4 shrink-0 text-text-muted/50" />
                <span>{meeting.location}</span>
              </div>
            )}
            {meeting.notes && (
              <div className="flex items-start gap-3 text-[14px] text-text-secondary">
                <FileText className="h-4 w-4 shrink-0 mt-0.5 text-text-muted/50" />
                <span className="whitespace-pre-wrap leading-relaxed">{meeting.notes}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Record new */}
      <Card className="border-accent/10 bg-accent/[0.02]" style={{ animation: "fade-in-up 0.6s ease-out 0.15s both" }}>
        <CardContent className="p-6">
          <Link href={`/meetings/${meetingId}/recording`}>
            <Button className="w-full" size="lg">
              <Mic className="h-4 w-4 ml-2" />
              {summaries.length > 0 ? "ضبط جدید" : "شروع ضبط"}
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* All Recordings */}
      {summaries.length > 0 && (
        <div className="space-y-4" style={{ animation: "fade-in-up 0.6s ease-out 0.2s both" }}>
          <h2 className="text-[12px] font-medium text-text-muted tracking-[0.15em] uppercase px-1">
            ضبط\u200cها ({summaries.length})
          </h2>

          {summaries.map((summary, index) => {
            const isExpanded = expandedId === summary.id || (expandedId === null && index === 0)

            return (
              <Card key={summary.id} className="overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : summary.id)}
                  className="w-full flex items-center justify-between p-5 sm:p-6 text-right hover:bg-surface-elevated/20 transition-all duration-500 cursor-pointer"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/8 shrink-0">
                      <Mic className="h-4 w-4 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium text-text-primary truncate">
                        {summary.title || `ضبط ${index + 1}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[12px] text-text-muted">
                          {new Date(summary.createdAt).toLocaleDateString("fa-IR", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {summary.durationSeconds > 0 && (
                          <>
                            <span className="text-text-muted/20">·</span>
                            <span className="text-[12px] text-text-muted">
                              {formatDuration(summary.durationSeconds * 1000)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 mr-3">
                    <div className="flex gap-2">
                      {summary.keyPoints.length > 0 && (
                        <Badge variant="default" className="text-[10px]">
                          {summary.keyPoints.length} نکته
                        </Badge>
                      )}
                      {summary.actionItems.length > 0 && (
                        <Badge variant="warning" className="text-[10px]">
                          {summary.actionItems.length} اقدام
                        </Badge>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-text-muted/30" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-text-muted/30" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 sm:px-6 pb-6 space-y-6 border-t border-border/20">
                    {summary.transcript && (
                      <div className="pt-5">
                        <h4 className="text-[11px] font-medium text-text-muted/50 mb-3 uppercase tracking-[0.15em]">
                          متن پیاده\u200cشده
                        </h4>
                        <div className="p-5 rounded-[16px] bg-surface-elevated/30 text-[14px] text-text-secondary max-h-48 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                          {summary.transcript}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="text-[11px] font-medium text-text-muted/50 mb-3 uppercase tracking-[0.15em] flex items-center gap-2">
                        <Zap className="h-3 w-3 text-accent/60" />
                        خلاصه
                      </h4>
                      <p className="text-[14px] text-text-secondary leading-relaxed">
                        {summary.summary}
                      </p>
                    </div>

                    {summary.keyPoints.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-medium text-text-muted/50 mb-3 uppercase tracking-[0.15em] flex items-center gap-2">
                          <Key className="h-3 w-3 text-accent/60" />
                          نکات کلیدی
                        </h4>
                        <ul className="space-y-2.5">
                          {summary.keyPoints.map((point, i) => (
                            <li key={i} className="flex items-start gap-3 text-[14px] text-text-secondary">
                              <span className="text-accent/40 mt-2 text-[8px]">●</span>
                              <span className="leading-relaxed">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {summary.actionItems.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-medium text-text-muted/50 mb-3 uppercase tracking-[0.15em] flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-warning/60" />
                          اقدام\u200cها
                        </h4>
                        <ul className="space-y-2.5">
                          {summary.actionItems.map((item, i) => (
                            <li key={i} className="flex items-start gap-3 text-[14px] text-text-secondary">
                              <span className="text-warning/40 mt-2 text-[8px]">●</span>
                              <span className="leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete */}
      {meeting.source === "manual" && (
        <div style={{ animation: "fade-in-up 0.6s ease-out 0.3s both" }}>
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
        </div>
      )}
    </div>
  )
}
