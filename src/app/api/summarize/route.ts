import { NextResponse } from "next/server"
import { getCurrentUserId } from "@/lib/supabase/server"
import { summarizeText } from "@/lib/services/ai"

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { transcript } = await request.json()

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      )
    }

    const result = await summarizeText(transcript)

    return NextResponse.json(result)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Summarization failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
