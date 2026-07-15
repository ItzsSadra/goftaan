import { NextResponse } from "next/server"
import { getDb, getCurrentUserId } from "@/lib/supabase/server"
import { transcribeAudio } from "@/lib/services/speech"
import { summarizeText } from "@/lib/services/ai"

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const audioFile = formData.get("audio") as File | null
    const meetingId = formData.get("meetingId") as string | null

    if (!audioFile || !meetingId) {
      return NextResponse.json(
        { error: "Audio file and meetingId are required" },
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

    // Step 1: Transcribe
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const transcript = await transcribeAudio(buffer, audioFile.type)

    // Step 2: Summarize
    const summaryResult = await summarizeText(transcript)

    // Step 3: Save to database
    const { data: summaryData, error: saveError } = await db
      .from("summaries")
      .insert({
        meeting_id: meetingId,
        transcript,
        summary: summaryResult.summary,
        key_points: summaryResult.keyPoints,
        action_items: summaryResult.actionItems,
      })
      .select()
      .single()

    if (saveError) {
      throw new Error(`Failed to save summary: ${saveError.message}`)
    }

    return NextResponse.json({
      id: summaryData.id,
      meetingId: summaryData.meeting_id,
      transcript: summaryData.transcript || "",
      summary: summaryData.summary || "",
      keyPoints: summaryData.key_points || [],
      actionItems: summaryData.action_items || [],
      createdAt: summaryData.created_at,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Processing failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
