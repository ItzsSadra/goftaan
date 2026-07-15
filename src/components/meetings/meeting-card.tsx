"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Trash2, Mic } from "lucide-react"
import type { Meeting, MeetingSummary } from "@/types"
import { formatMeetingTime } from "@/lib/utils"

interface MeetingCardProps {
  meeting: Meeting
  summaries?: MeetingSummary[]
  compact?: boolean
  onDelete?: (id: string) => void
}

export function MeetingCard({
  meeting,
  summaries = [],
  compact = false,
  onDelete,
}: MeetingCardProps) {
  const now = new Date()
  const endDate = new Date(meeting.endAt)
  const isPast = endDate < now
  const recordingCount = summaries.length

  return (
    <Link href={`/meetings/${meeting.id}`}>
      <div
        className={cn(
          "group relative rounded-[20px] border border-border/30 bg-surface/50 backdrop-blur-sm p-5 sm:p-6 transition-all duration-500 ease-out hover:bg-surface-elevated/40 hover:border-border/50 hover:shadow-xl hover:shadow-black/10 cursor-pointer",
          compact && "p-4 sm:p-5"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                "font-medium text-text-primary truncate tracking-tight",
                compact ? "text-[15px]" : "text-[16px]"
              )}
            >
              {meeting.title}
            </h3>

            <div className="flex items-center gap-2 mt-2.5 text-[13px] text-text-muted">
              <Clock className="h-3.5 w-3.5 shrink-0 opacity-50" />
              <span className="truncate">
                {formatMeetingTime(meeting.startAt, meeting.endAt)}
              </span>
            </div>

            {meeting.location && !compact && (
              <div className="flex items-center gap-2 mt-1.5 text-[13px] text-text-muted">
                <MapPin className="h-3.5 w-3.5 shrink-0 opacity-50" />
                <span className="truncate">{meeting.location}</span>
              </div>
            )}

            {!compact && (
              <>
                {recordingCount > 0 && (
                  <div className="flex items-center gap-2 mt-3 text-[12px] text-accent/80">
                    <Mic className="h-3 w-3" />
                    <span className="font-medium">
                      {recordingCount} ضبط
                    </span>
                  </div>
                )}
                {summaries.length > 0 && summaries[0].summary && (
                  <div className="mt-4 p-4 rounded-[16px] bg-surface-elevated/30 border border-border/20">
                    <p className="text-[13px] text-text-muted line-clamp-2 leading-relaxed">
                      {summaries[0].summary}
                    </p>
                    {(summaries[0].keyPoints.length > 0 ||
                      summaries[0].actionItems.length > 0) && (
                      <div className="flex gap-4 mt-2.5">
                        {summaries[0].keyPoints.length > 0 && (
                          <span className="text-[11px] text-accent/70 font-medium tracking-wide">
                            {summaries[0].keyPoints.length} نکته کلیدی
                          </span>
                        )}
                        {summaries[0].actionItems.length > 0 && (
                          <span className="text-[11px] text-warning/70 font-medium tracking-wide">
                            {summaries[0].actionItems.length} اقدام
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex flex-col items-end gap-2.5 shrink-0">
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
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full text-text-muted/30 hover:text-danger hover:bg-danger/10 transition-all duration-500 cursor-pointer"
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
