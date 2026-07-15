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

    const { data, error } = await db
      .from("summaries")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return NextResponse.json({ summary: null })
    }

    return NextResponse.json({
      summary: {
        id: data.id,
        meetingId: data.meeting_id,
        transcript: data.transcript || "",
        summary: data.summary || "",
        keyPoints: data.key_points || [],
        actionItems: data.action_items || [],
        createdAt: data.created_at,
      },
    })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
