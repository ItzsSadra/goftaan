import { NextResponse } from "next/server"
import { getDb, getCurrentUserId } from "@/lib/supabase/server"

export async function GET() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = getDb()
    const now = new Date().toISOString()

    const { data: allMeetings, error } = await db
      .from("meetings")
      .select("*")
      .eq("user_id", userId)
      .order("start_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const mapMeeting = (m: Record<string, unknown>) => ({
      id: m.id,
      userId: m.user_id,
      title: m.title,
      location: m.location || "",
      notes: m.notes || "",
      startAt: m.start_at,
      endAt: m.end_at,
      source: m.source,
      createdAt: m.created_at,
    })

    const upcoming = (allMeetings || [])
      .filter((m) => new Date(m.end_at) >= new Date(now))
      .reverse()
      .map(mapMeeting)

    const past = (allMeetings || [])
      .filter((m) => new Date(m.end_at) < new Date(now))
      .map(mapMeeting)

    // Fetch summaries for past meetings
    const pastIds = past.map((m) => m.id)
    const summaries: Record<string, unknown> = {}

    if (pastIds.length > 0) {
      const { data: summaryData } = await db
        .from("summaries")
        .select("*")
        .in("meeting_id", pastIds)
        .order("created_at", { ascending: false })

      for (const s of summaryData || []) {
        const mid = s.meeting_id as string
        if (!summaries[mid]) {
          summaries[mid] = {
            id: s.id,
            meetingId: mid,
            transcript: s.transcript || "",
            summary: s.summary || "",
            keyPoints: s.key_points || [],
            actionItems: s.action_items || [],
            createdAt: s.created_at,
          }
        }
      }
    }

    return NextResponse.json({ upcoming, past, summaries })
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

    const { title, location, notes, startAt, endAt, source } =
      await request.json()

    if (!title || !startAt || !endAt) {
      return NextResponse.json(
        { error: "Title, startAt, and endAt are required" },
        { status: 400 }
      )
    }

    const db = getDb()
    const { data, error } = await db
      .from("meetings")
      .insert({
        user_id: userId,
        title,
        location: location || "",
        notes: notes || "",
        start_at: startAt,
        end_at: endAt,
        source: source || "manual",
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      {
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
