"use client"

import { useState, useEffect, useCallback } from "react"
import type { Meeting, MeetingSummary } from "@/types"

interface MeetingsResponse {
  upcoming: Meeting[]
  past: Meeting[]
  summaries: Record<string, MeetingSummary>
}

interface UseMeetingsReturn {
  upcoming: Meeting[]
  past: Meeting[]
  summaries: Record<string, MeetingSummary>
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  deleteMeeting: (id: string) => Promise<void>
}

export function useMeetings(): UseMeetingsReturn {
  const [upcoming, setUpcoming] = useState<Meeting[]>([])
  const [past, setPast] = useState<Meeting[]>([])
  const [summaries, setSummaries] = useState<Record<string, MeetingSummary>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMeetings = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const res = await fetch("/api/meetings")
      if (!res.ok) {
        if (res.status === 401) {
          setError("Not authenticated")
          return
        }
        throw new Error("Failed to load meetings")
      }

      const data: MeetingsResponse = await res.json()
      setUpcoming(data.upcoming || [])
      setPast(data.past || [])
      setSummaries(data.summaries || {})
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load meetings")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteMeeting = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/meetings/${id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Failed to delete meeting")
        }

        setUpcoming((prev) => prev.filter((m) => m.id !== id))
        setPast((prev) => prev.filter((m) => m.id !== id))
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete meeting"
        )
      }
    },
    []
  )

  useEffect(() => {
    fetchMeetings()
  }, [fetchMeetings])

  return {
    upcoming,
    past,
    summaries,
    isLoading,
    error,
    refresh: fetchMeetings,
    deleteMeeting,
  }
}
