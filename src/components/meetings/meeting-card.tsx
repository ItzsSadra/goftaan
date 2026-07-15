"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  MapPin,
  MoreHorizontal,
  Pencil,
  Trash2,
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
  summary: string
  keyPoints: string[]
  actionItems: string[]
}

interface MeetingCardProps {
  meeting: Meeting
  summary?: Summary
  onDelete: (id: string) => Promise<void>
}

function formatRelativeDate(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  const weekDays = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"]
  const dayName = weekDays[d.getDay()]
  const dayNum = d.getDate()
  const month = d.toLocaleDateString("fa-IR", { month: "long" })

  if (diffDays === 0) return `امروز`
  if (diffDays === 1) return `فردا`
  if (diffDays === -1) return `دیروز`
  if (diffDays > 1 && diffDays <= 6) return dayName
  if (diffDays < -1 && diffDays >= -6) return dayName
  return `${dayName} ${dayNum} ${month}`
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

export function MeetingCard({ meeting, summary, onDelete }: MeetingCardProps) {
  const router = useRouter()
  const [showActions, setShowActions] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  const isPast = new Date(meeting.endAt) < new Date()

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete(meeting.id)
    setDeleting(false)
    setShowActions(false)
  }

  return (
    <div
      className="flex items-start gap-3 rounded-[16px] border border-border bg-surface p-4 cursor-pointer hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-shadow relative"
      onClick={() => router.push(`/meetings/${meeting.id}`)}
    >
      <div className={`w-1 self-stretch rounded-full shrink-0 mt-0.5 ${isPast ? "bg-text-muted" : "bg-accent"}`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold text-text-primary truncate">
              {meeting.title}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge variant={isPast ? "secondary" : "default"} className="text-[11px] px-2 py-0.5">
                {isPast ? "برگزار شده" : "پیش رو"}
              </Badge>
              <span className="text-[12px] text-text-secondary">{formatRelativeDate(meeting.startAt)}</span>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowActions(!showActions)
              }}
              className="p-1.5 rounded-lg hover:bg-background-accent transition-colors cursor-pointer text-text-muted"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {showActions && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} />
                <div className="absolute left-0 top-full mt-1 bg-surface border border-border rounded-xl shadow-lg z-50 py-1 min-w-[140px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/meetings/${meeting.id}/edit`)
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-[13px] font-bold text-text-primary hover:bg-background-accent transition-colors cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5 text-text-muted" />
                    ویرایش
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete()
                    }}
                    disabled={deleting}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-[13px] font-bold text-danger hover:bg-danger-bg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deleting ? "در حال حذف..." : "حذف"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-2 text-[12px] text-text-secondary">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-text-muted" />
            {formatTime(meeting.startAt)} – {formatTime(meeting.endAt)}
          </span>
          <span>{getDuration(meeting.startAt, meeting.endAt)} دقیقه</span>
          {meeting.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-text-muted" />
              {meeting.location}
            </span>
          )}
        </div>

        {summary?.summary && (
          <p className="text-[13px] text-text-secondary mt-2 leading-5 line-clamp-2">
            {summary.summary}
          </p>
        )}
      </div>
    </div>
  )
}
