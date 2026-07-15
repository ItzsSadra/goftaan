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

    // Fetch latest summary
    const { data: summary } = await db
      .from("summaries")
      .select("*")
      .eq("meeting_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

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
      summary: summary
        ? {
            id: summary.id,
            meetingId: summary.meeting_id,
            transcript: summary.transcript || "",
            summary: summary.summary || "",
            keyPoints: summary.key_points || [],
            actionItems: summary.action_items || [],
            createdAt: summary.created_at,
          }
        : null,
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
    const { data: meeting, error: fetchError } = await db
      .from("meetings")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .single()

    if (fetchError || !meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    }

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
