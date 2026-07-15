"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAudioRecorder } from "@/hooks/use-audio-recorder"
import { useAudioPlayer } from "@/hooks/use-audio-player"
import { useWebSpeechRecognition } from "@/hooks/use-web-speech-recognition"
import { useToast } from "@/components/ui/toast"
import type { AiProcessingStep } from "@/types"
import {
  ArrowRight,
  Mic,
  Pause,
  Play,
  Square,
  RotateCcw,
  Loader2,
  CheckCircle2,
  Circle,
  AlertCircle,
  Zap,
} from "lucide-react"
import { formatDuration } from "@/lib/utils"

const STEP_LABELS: Record<AiProcessingStep, string> = {
  idle: "",
  transcribing: "در حال دریافت متن از صدا",
  transcribed: "متن دریافت شد",
  summarizing: "در حال تولید خلاصه با هوش مصنوعی",
  saving: "در حال ذخیره‌سازی",
  done: "تمام شد",
  error: "خطا رخ داد",
}

export default function RecordingPage() {
  const router = useRouter()
  const params = useParams()
  const meetingId = params.id as string
  const { toast } = useToast()

  const {
    status: recordingStatus,
    audioBlob,
    audioUrl,
    duration,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    error: recordingError,
  } = useAudioRecorder()

  const {
    isPlaying,
    currentTime,
    duration: playerDuration,
    play,
    pause,
    replay,
  } = useAudioPlayer(audioUrl)

  const {
    transcript: liveTranscript,
    isListening,
    startListening,
    stopListening,
  } = useWebSpeechRecognition("fa-IR")

  const [aiStep, setAiStep] = React.useState<AiProcessingStep>("idle")

  // Start speech recognition when recording starts (web only)
  React.useEffect(() => {
    if (recordingStatus === "recording" && typeof window !== "undefined") {
      startListening()
    }
    if (
      recordingStatus === "completed" ||
      recordingStatus === "error" ||
      recordingStatus === "idle"
    ) {
      stopListening()
    }
  }, [recordingStatus, startListening, stopListening])

  const processRecording = async () => {
    if (!audioBlob) return

    try {
      setAiStep("transcribing")

      const formData = new FormData()
      formData.append("audio", audioBlob, "recording.webm")
      formData.append("meetingId", meetingId)

      // If we have a live transcript from Web Speech API, skip transcription
      if (liveTranscript) {
        setAiStep("summarizing")
        const summaryResponse = await fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: liveTranscript }),
        })

        if (!summaryResponse.ok)
          throw new Error("Failed to summarize")

        const summaryData = await summaryResponse.json()

        setAiStep("saving")

        const saveResponse = await fetch("/api/summaries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            meetingId,
            transcript: liveTranscript,
            summary: summaryData.summary,
            keyPoints: summaryData.keyPoints,
            actionItems: summaryData.actionItems,
          }),
        })

        if (!saveResponse.ok) throw new Error("Failed to save")

        setAiStep("done")
        toast({ title: "پردازش کامل شد", variant: "success" })
      } else {
        // Full pipeline: transcribe -> summarize -> save
        const transcribeResponse = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        })

        if (!transcribeResponse.ok)
          throw new Error("Failed to transcribe")

        const { transcript } = await transcribeResponse.json()
        setAiStep("summarizing")

        const summaryResponse = await fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript }),
        })

        if (!summaryResponse.ok)
          throw new Error("Failed to summarize")

        const summaryData = await summaryResponse.json()

        setAiStep("saving")

        const saveResponse = await fetch("/api/summaries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            meetingId,
            transcript,
            summary: summaryData.summary,
            keyPoints: summaryData.keyPoints,
            actionItems: summaryData.actionItems,
          }),
        })

        if (!saveResponse.ok) throw new Error("Failed to save")

        setAiStep("done")
        toast({ title: "پردازش کامل شد", variant: "success" })
      }
    } catch (err) {
      setAiStep("error")
      toast({
        title: "خطا در پردازش",
        description: err instanceof Error ? err.message : "خطای ناشناخته",
        variant: "destructive",
      })
    }
  }

  const isRecording =
    recordingStatus === "recording" || recordingStatus === "paused"
  const isCompleted = recordingStatus === "completed"
  const isProcessing = aiStep !== "idle" && aiStep !== "done" && aiStep !== "error"

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-gray-900">ضبط صدا</h1>
      </div>

      {/* Recording Card */}
      <Card>
        <CardContent className="p-6">
          {/* Timer */}
          <div className="text-center mb-6">
            <div
              className={`text-5xl font-mono font-bold ${
                isRecording ? "text-red-500" : "text-gray-900"
              }`}
            >
              {formatDuration(duration)}
            </div>
            {isRecording && (
              <div className="mt-2 flex items-center justify-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm text-red-500">
                  {recordingStatus === "recording" ? "در حال ضبط" : "مکث"}
                </span>
              </div>
            )}
          </div>

          {/* Live transcript */}
          {isRecording && liveTranscript && (
            <div className="mb-4 p-3 rounded-lg bg-indigo-50 border border-indigo-200 max-h-32 overflow-y-auto">
              <p className="text-sm text-indigo-700 leading-relaxed">
                {liveTranscript}
              </p>
            </div>
          )}

          {/* Recording controls */}
          <div className="flex items-center justify-center gap-3">
            {recordingStatus === "idle" && (
              <Button size="lg" onClick={startRecording} className="rounded-full h-16 w-16">
                <Mic className="h-6 w-6" />
              </Button>
            )}

            {recordingStatus === "recording" && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={pauseRecording}
                  className="rounded-full h-12 w-12"
                >
                  <Pause className="h-5 w-5" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={stopRecording}
                  className="rounded-full h-16 w-16"
                >
                  <Square className="h-6 w-6" />
                </Button>
              </>
            )}

            {recordingStatus === "paused" && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={resumeRecording}
                  className="rounded-full h-12 w-12"
                >
                  <Play className="h-5 w-5" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={stopRecording}
                  className="rounded-full h-16 w-16"
                >
                  <Square className="h-6 w-6" />
                </Button>
              </>
            )}

            {recordingStatus === "completed" && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={isPlaying ? pause : play}
                  className="rounded-full h-12 w-12"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={replay}
                  className="rounded-full h-12 w-12"
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>

          {recordingError && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600 text-center">
                {recordingError}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing steps */}
      {isCompleted && (
        <Card>
          <CardHeader>
            <CardTitle>پردازش هوشمند</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(["transcribing", "summarizing", "saving"] as const).map(
              (step) => {
                const stepOrder: AiProcessingStep[] = [
                  "transcribing",
                  "summarizing",
                  "saving",
                ]
                const currentIdx = stepOrder.indexOf(aiStep)
                const stepIdx = stepOrder.indexOf(step)

                const isDone =
                  aiStep === "done" || currentIdx > stepIdx
                const isCurrent = aiStep === step
                const isPending = currentIdx < stepIdx

                return (
                  <div
                    key={step}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="h-5 w-5 text-indigo-500 animate-spin shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-300 shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        isDone
                          ? "text-emerald-600"
                          : isCurrent
                            ? "text-indigo-600 font-medium"
                            : "text-gray-400"
                      }`}
                    >
                      {STEP_LABELS[step]}
                    </span>
                  </div>
                )
              }
            )}

            {aiStep === "error" && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm text-red-600">
                  خطا در پردازش. لطفاً دوباره تلاش کنید.
                </span>
              </div>
            )}

            {aiStep === "done" && (
              <Button
                className="w-full"
                onClick={() => router.push(`/meetings/${meetingId}`)}
              >
                مشاهده نتیجه
              </Button>
            )}

            {aiStep === "error" && (
              <Button
                variant="outline"
                className="w-full"
                onClick={processRecording}
              >
                تلاش مجدد
              </Button>
            )}

            {aiStep === "idle" && (
              <Button
                className="w-full"
                onClick={processRecording}
                disabled={isProcessing}
              >
                <Zap className="h-4 w-4 ml-2" />
                پردازش با هوش مصنوعی
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reset */}
      {isCompleted && aiStep === "idle" && (
        <Button variant="ghost" className="w-full" onClick={resetRecording}>
          <RotateCcw className="h-4 w-4 ml-2" />
          ضبط مجدد
        </Button>
      )}
    </div>
  )
}
