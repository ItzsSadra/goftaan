"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Trash2 } from "lucide-react"
import type { Meeting, MeetingSummary } from "@/types"
import { formatMeetingTime } from "@/lib/utils"

interface MeetingCardProps {
  meeting: Meeting
  summary?: MeetingSummary | null
  compact?: boolean
  onDelete?: (id: string) => void
}

export function MeetingCard({
  meeting,
  summary,
  compact = false,
  onDelete,
}: MeetingCardProps) {
  const now = new Date()
  const endDate = new Date(meeting.endAt)
  const isPast = endDate < now

  return (
    <Link href={`/meetings/${meeting.id}`}>
      <div
        className={cn(
          "group relative rounded-2xl border border-border bg-surface/60 backdrop-blur-sm p-4 sm:p-5 transition-all duration-300 hover:bg-surface-elevated/50 hover:border-border hover:shadow-xl hover:shadow-black/10 cursor-pointer",
          compact && "p-3 sm:p-4"
        )}
      >
        {/* Accent gradient bar */}
        <div
          className={cn(
            "absolute right-0 top-3 bottom-3 w-[3px] rounded-full transition-all duration-300 group-hover:h-full group-hover:top-0 group-hover:bottom-0",
            isPast
              ? "bg-text-muted/30"
              : meeting.source === "manual"
                ? "bg-gradient-to-b from-success to-success/50"
                : "bg-gradient-to-b from-accent to-accent/50"
          )}
        />

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 pr-1">
            <h3
              className={cn(
                "font-semibold text-text-primary truncate",
                compact ? "text-sm" : "text-[15px]"
              )}
            >
              {meeting.title}
            </h3>

            <div className="flex items-center gap-1.5 mt-2 text-xs text-text-muted">
              <Clock className="h-3.5 w-3.5 shrink-0 opacity-60" />
              <span className="truncate">
                {formatMeetingTime(meeting.startAt, meeting.endAt)}
              </span>
            </div>

            {meeting.location && !compact && (
              <div className="flex items-center gap-1.5 mt-1 text-xs text-text-muted">
                <MapPin className="h-3.5 w-3.5 shrink-0 opacity-60" />
                <span className="truncate">{meeting.location}</span>
              </div>
            )}

            {/* Summary preview */}
            {summary && !compact && (
              <div className="mt-3 p-3 rounded-xl bg-surface-elevated/50 border border-border-subtle">
                <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                  {summary.summary}
                </p>
                {(summary.keyPoints.length > 0 ||
                  summary.actionItems.length > 0) && (
                  <div className="flex gap-3 mt-2">
                    {summary.keyPoints.length > 0 && (
                      <span className="text-[11px] text-accent font-medium">
                        {summary.keyPoints.length} نکته کلیدی
                      </span>
                    )}
                    {summary.actionItems.length > 0 && (
                      <span className="text-[11px] text-warning font-medium">
                        {summary.actionItems.length} اقدام
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge
              variant={
                isPast
                  ? "secondary"
                  : meeting.source === "manual"
                    ? "success"
                    : "default"
              }
            >
              {isPast
                ? "گذشته"
                : meeting.source === "manual"
                  ? "دستی"
                  : "تقویم"}
            </Badge>

            {onDelete && meeting.source === "manual" && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onDelete(meeting.id)
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-all cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
