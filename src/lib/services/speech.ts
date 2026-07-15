import { AssemblyAI } from "assemblyai"

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!,
})

export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const transcript = await client.transcripts.transcribe({
    audio: audioBuffer,
    speech_models: ["universal-3-5-pro", "universal-2"],
    language_code: "fa",
    punctuate: true,
    format_text: true,
    prompt: "این یک ضبط صدا از یک جلسه کاری به زبان فارسی است.",
  })

  if (transcript.status === "error") {
    throw new Error(transcript.error || "AssemblyAI transcription failed")
  }

  if (!transcript.text) {
    throw new Error("No transcript returned from AssemblyAI")
  }

  return transcript.text
}
