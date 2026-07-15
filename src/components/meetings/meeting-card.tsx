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
          "group relative rounded-xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:shadow-md hover:border-indigo-200 cursor-pointer",
          compact && "p-3"
        )}
      >
        {/* Accent bar */}
        <div
          className={cn(
            "absolute right-0 top-0 bottom-0 w-1 rounded-r-xl",
            isPast
              ? "bg-gray-300"
              : meeting.source === "manual"
                ? "bg-emerald-500"
                : "bg-indigo-500"
          )}
        />

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                "font-semibold text-gray-900 truncate",
                compact ? "text-sm" : "text-base"
              )}
            >
              {meeting.title}
            </h3>

            <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {formatMeetingTime(meeting.startAt, meeting.endAt)}
              </span>
            </div>

            {meeting.location && !compact && (
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{meeting.location}</span>
              </div>
            )}

            {/* Summary preview */}
            {summary && !compact && (
              <div className="mt-3 p-3 rounded-lg bg-gray-50">
                <p className="text-xs text-gray-600 line-clamp-2">
                  {summary.summary}
                </p>
                {(summary.keyPoints.length > 0 ||
                  summary.actionItems.length > 0) && (
                  <div className="flex gap-3 mt-2">
                    {summary.keyPoints.length > 0 && (
                      <span className="text-xs text-indigo-600">
                        {summary.keyPoints.length} نکته کلیدی
                      </span>
                    )}
                    {summary.actionItems.length > 0 && (
                      <span className="text-xs text-amber-600">
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
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
