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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">جلسه یافت نشد</p>
        <Button variant="ghost" onClick={() => router.push("/meetings")} className="mt-4">
          بازگشت
        </Button>
      </div>
    )
  }

  const now = new Date()
  const isPast = new Date(meeting.endAt) < now

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{meeting.title}</h1>
          <div className="flex items-center gap-2 mt-1">
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
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4 shrink-0" />
              <span>{formatMeetingTime(meeting.startAt, meeting.endAt)}</span>
            </div>
            {meeting.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{meeting.location}</span>
              </div>
            )}
            {meeting.notes && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <FileText className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="whitespace-pre-wrap">{meeting.notes}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recording */}
      {!isPast && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-indigo-600" />
              ضبط صدا
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              صدای جلسه را ضبط کنید تا با هوش مصنوعی تبدیل به متن و خلاصه شود.
            </p>
            <Link href={`/meetings/${meetingId}/recording`}>
              <Button className="w-full">
                <Mic className="h-4 w-4 ml-2" />
                شروع ضبط
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* AI Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              خلاصه هوشمند
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.transcript && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  متن پیاده‌شده
                </h4>
                <div className="p-3 rounded-lg bg-gray-50 text-sm text-gray-600 max-h-40 overflow-y-auto">
                  {summary.transcript}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                خلاصه
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {summary.summary}
              </p>
            </div>

            {summary.keyPoints.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Key className="h-4 w-4 text-indigo-500" />
                  نکات کلیدی
                </h4>
                <ul className="space-y-1.5">
                  {summary.keyPoints.map((point, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <span className="text-indigo-500 mt-1">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.actionItems.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-500" />
                  اقدام‌ها
                </h4>
                <ul className="space-y-1.5">
                  {summary.actionItems.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <span className="text-amber-500 mt-1">•</span>
                      {item}
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
        <Card className="border-red-200">
          <CardContent className="p-4">
            <Button
              variant="destructive"
              className="w-full"
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
