import { NextResponse } from "next/server"
import { getDb, getCurrentUserId } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { meetingId, transcript, summary, keyPoints, actionItems, title, durationSeconds } =
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
        title: title || "",
        transcript: transcript || "",
        summary: summary || "",
        key_points: keyPoints || [],
        action_items: actionItems || [],
        duration_seconds: durationSeconds || 0,
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
          title: data.title || "",
          transcript: data.transcript || "",
          summary: data.summary || "",
          keyPoints: data.key_points || [],
          actionItems: data.action_items || [],
          durationSeconds: data.duration_seconds || 0,
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
