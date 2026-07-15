import { NextResponse } from "next/server"
import { getDb, getCurrentUserId } from "@/lib/supabase/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { meetingId } = await params
    const userId = await getCurrentUserId()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

    // Return ALL summaries for this meeting
    const { data, error } = await db
      .from("summaries")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const summaries = (data || []).map((s) => ({
      id: s.id,
      meetingId: s.meeting_id,
      title: s.title || "",
      transcript: s.transcript || "",
      summary: s.summary || "",
      keyPoints: s.key_points || [],
      actionItems: s.action_items || [],
      durationSeconds: s.duration_seconds || 0,
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
