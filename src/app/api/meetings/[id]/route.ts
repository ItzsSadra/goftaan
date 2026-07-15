import { NextResponse } from "next/server"
import { getDb, getCurrentUserId } from "@/lib/supabase/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = getDb()
    const { data: meeting, error } = await db
      .from("meetings")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single()

    if (error || !meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    }

    // Fetch ALL summaries for this meeting
    const { data: summaryData } = await db
      .from("summaries")
      .select("*")
      .eq("meeting_id", id)
      .order("created_at", { ascending: false })

    const summaries = (summaryData || []).map((s) => ({
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

    return NextResponse.json({
      meeting: {
        id: meeting.id,
        userId: meeting.user_id,
        title: meeting.title,
        location: meeting.location || "",
        notes: meeting.notes || "",
        startAt: meeting.start_at,
        endAt: meeting.end_at,
        source: meeting.source,
        createdAt: meeting.created_at,
      },
      summaries,
    })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, location, notes, startAt, endAt } = body

    const db = getDb()
    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (location !== undefined) updateData.location = location
    if (notes !== undefined) updateData.notes = notes
    if (startAt !== undefined) updateData.start_at = startAt
    if (endAt !== undefined) updateData.end_at = endAt

    const { data, error } = await db
      .from("meetings")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      meeting: {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        location: data.location || "",
        notes: data.notes || "",
        startAt: data.start_at,
        endAt: data.end_at,
        source: data.source,
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = getDb()
    const { error } = await db
      .from("meetings")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
