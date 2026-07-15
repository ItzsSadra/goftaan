import { NextResponse } from "next/server"
import { getDb, getCurrentUserId } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const meetingIds = searchParams.get("meetingIds")

    if (!meetingIds) {
      return NextResponse.json(
        { error: "meetingIds parameter is required" },
        { status: 400 }
      )
    }

    const ids = meetingIds.split(",").filter(Boolean)
    const db = getDb()

    // Get user's meeting IDs first for authorization
    const { data: userMeetings } = await db
      .from("meetings")
      .select("id")
      .eq("user_id", userId)
      .in("id", ids)

    const authorizedIds = (userMeetings || []).map((m) => m.id)

    if (authorizedIds.length === 0) {
      return NextResponse.json({ summaries: [] })
    }

    const { data, error } = await db
      .from("summaries")
      .select("*")
      .in("meeting_id", authorizedIds)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const summaries = (data || []).map((s) => ({
      id: s.id,
      meetingId: s.meeting_id,
      transcript: s.transcript || "",
      summary: s.summary || "",
      keyPoints: s.key_points || [],
      actionItems: s.action_items || [],
      createdAt: s.created_at,
    }))

    return NextResponse.json({ summaries })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { meetingId, transcript, summary, keyPoints, actionItems } =
      await request.json()

    if (!meetingId) {
      return NextResponse.json(
        { error: "meetingId is required" },
        { status: 400 }
      )
    }

    const db = getDb()

    // Verify meeting belongs to user
    const { data: meeting } = await db
      .from("meetings")
      .select("id")
      .eq("id", meetingId)
      .eq("user_id", userId)
      .single()

    if (!meeting) {
      return NextResponse.json(
        { error: "Meeting not found" },
        { status: 404 }
      )
    }

    const { data, error } = await db
      .from("summaries")
      .insert({
        meeting_id: meetingId,
        transcript: transcript || "",
        summary: summary || "",
        key_points: keyPoints || [],
        action_items: actionItems || [],
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      {
        summary: {
          id: data.id,
          meetingId: data.meeting_id,
          transcript: data.transcript || "",
          summary: data.summary || "",
          keyPoints: data.key_points || [],
          actionItems: data.action_items || [],
          createdAt: data.created_at,
        },
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
