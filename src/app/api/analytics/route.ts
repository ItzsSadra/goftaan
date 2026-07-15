import { NextResponse } from "next/server"
import { getDb, getCurrentUserId } from "@/lib/supabase/server"

export async function GET() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = getDb()

    const { data: meetings } = await db
      .from("meetings")
      .select("*")
      .eq("user_id", userId)

    const allMeetings = meetings || []

    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const totalMeetings = allMeetings.length

    const thisWeekMeetings = allMeetings.filter(
      (m) => new Date(m.start_at) >= weekStart
    ).length

    // Fetch summaries for coverage
    const meetingIds = allMeetings.map((m) => m.id)
    let meetingsWithSummary = 0
    let totalKeyPoints = 0
    let overdueActions = 0

    if (meetingIds.length > 0) {
      const { data: summaries } = await db
        .from("summaries")
        .select("meeting_id, key_points, action_items")
        .in("meeting_id", meetingIds)

      const summaryMeetingIds = new Set(
        (summaries || []).map((s) => s.meeting_id)
      )
      meetingsWithSummary = summaryMeetingIds.size

      for (const s of summaries || []) {
        totalKeyPoints += (s.key_points || []).length
      }

      // Count overdue actions (meetings that have ended)
      for (const s of summaries || []) {
        const meeting = allMeetings.find((m) => m.id === s.meeting_id)
        if (meeting && new Date(meeting.end_at) < now) {
          overdueActions += (s.action_items || []).length
        }
      }
    }

    const summaryCoverage =
      totalMeetings > 0
        ? Math.round((meetingsWithSummary / totalMeetings) * 100)
        : 0

    const totalDuration = allMeetings.reduce((acc, m) => {
      return acc + (new Date(m.end_at).getTime() - new Date(m.start_at).getTime())
    }, 0)
    const avgDuration =
      totalMeetings > 0
        ? Math.round(totalDuration / totalMeetings / 60000)
        : 0

    // Next 7 days chart data
    const next7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now)
      date.setDate(now.getDate() + i)
      const dayStr = date.toISOString().split("T")[0]
      const count = allMeetings.filter((m) => {
        const mDate = new Date(m.start_at).toISOString().split("T")[0]
        return mDate === dayStr
      }).length
      return {
        day: date.toLocaleDateString("fa-IR", { weekday: "short" }),
        count,
      }
    })

    return NextResponse.json({
      totalMeetings,
      thisWeekMeetings,
      summaryCoverage,
      avgDuration,
      totalKeyPoints,
      overdueActions,
      next7Days,
    })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
