import { NextResponse } from "next/server"
import { getCurrentUserId } from "@/lib/supabase/server"
import { transcribeAudio } from "@/lib/services/speech"

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const audioFile = formData.get("audio") as File | null

    if (!audioFile) {
      return NextResponse.json(
        { error: "Audio file is required" },
        { status: 400 }
      )
    }

    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const transcript = await transcribeAudio(buffer, audioFile.type)

    return NextResponse.json({ transcript })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Transcription failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
