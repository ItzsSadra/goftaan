import { NextResponse } from "next/server"
import { getDb, getCurrentUserId } from "@/lib/supabase/server"
import { hashPassword } from "@/lib/auth"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getCurrentUserId()

    if (!userId || userId !== id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = getDb()
    const { data, error } = await db
      .from("users")
      .select("id, name, email")
      .eq("id", id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ user: data })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getCurrentUserId()

    if (!userId || userId !== id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, email, password } = await request.json()
    const db = getDb()

    // Check if email is taken by another user
    if (email) {
      const { data: existing } = await db
        .from("users")
        .select("id")
        .eq("email", email.toLowerCase().trim())
        .neq("id", id)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (name) updateData.name = name
    if (email) updateData.email = email.toLowerCase().trim()
    if (password) updateData.password_hash = await hashPassword(password)

    const { data, error } = await db
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select("id, name, email")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ user: data })
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

    if (!userId || userId !== id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = getDb()

    // Delete summaries first, then meetings, then user
    const { data: meetings } = await db
      .from("meetings")
      .select("id")
      .eq("user_id", id)

    const meetingIds = (meetings || []).map((m) => m.id)
    if (meetingIds.length > 0) {
      await db.from("summaries").delete().in("meeting_id", meetingIds)
    }

    const { error: meetingsErr } = await db
      .from("meetings")
      .delete()
      .eq("user_id", id)

    if (meetingsErr) {
      return NextResponse.json(
        { error: "Failed to delete meetings" },
        { status: 500 }
      )
    }

    const { error: userErr } = await db.from("users").delete().eq("id", id)

    if (userErr) {
      return NextResponse.json(
        { error: "Failed to delete user" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
