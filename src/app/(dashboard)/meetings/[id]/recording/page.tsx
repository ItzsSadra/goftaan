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
        const formData = new FormData()
        formData.append("audio", audioBlob, "recording.webm")
        formData.append("meetingId", meetingId)

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
    <div className="max-w-lg mx-auto space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 animate-in fade-in-up">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
          ضبط صدا
        </h1>
      </div>

      {/* Recording Card */}
      <Card className="animate-in fade-in-up stagger-1">
        <CardContent className="p-6 sm:p-8">
          {/* Timer */}
          <div className="text-center mb-8">
            <div
              className={`text-5xl sm:text-6xl font-mono font-bold tracking-wider ${
                isRecording ? "text-danger" : "text-text-primary"
              }`}
            >
              {formatDuration(duration)}
            </div>
            {isRecording && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${recordingStatus === "recording" ? "bg-danger animate-pulse" : "bg-warning"}`} />
                <span className="text-sm text-text-muted">
                  {recordingStatus === "recording" ? "در حال ضبط" : "مکث"}
                </span>
              </div>
            )}
          </div>

          {/* Live transcript */}
          {isRecording && liveTranscript && (
            <div className="mb-6 p-4 rounded-xl bg-accent/5 border border-accent/15 max-h-32 overflow-y-auto">
              <p className="text-sm text-accent/80 leading-relaxed">
                {liveTranscript}
              </p>
            </div>
          )}

          {/* Recording controls */}
          <div className="flex items-center justify-center gap-4">
            {recordingStatus === "idle" && (
              <button
                onClick={startRecording}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-accent shadow-xl shadow-accent/30 hover:bg-accent-dark hover:shadow-2xl hover:shadow-accent/40 transition-all duration-300 active:scale-95 cursor-pointer glow-accent"
              >
                <Mic className="h-8 w-8 text-white" />
              </button>
            )}

            {recordingStatus === "recording" && (
              <>
                <button
                  onClick={pauseRecording}
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface-elevated text-text-primary hover:bg-surface-elevated/80 transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  <Pause className="h-5 w-5" />
                </button>
                <button
                  onClick={stopRecording}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-danger shadow-xl shadow-danger/30 hover:bg-danger/90 transition-all duration-300 active:scale-95 cursor-pointer"
                >
                  <Square className="h-7 w-7 text-white" fill="currentColor" />
                </button>
              </>
            )}

            {recordingStatus === "paused" && (
              <>
                <button
                  onClick={resumeRecording}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-accent shadow-xl shadow-accent/30 hover:bg-accent-dark transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  <Play className="h-5 w-5 text-white" fill="currentColor" />
                </button>
                <button
                  onClick={stopRecording}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-danger shadow-xl shadow-danger/30 hover:bg-danger/90 transition-all duration-300 active:scale-95 cursor-pointer"
                >
                  <Square className="h-7 w-7 text-white" fill="currentColor" />
                </button>
              </>
            )}

            {recordingStatus === "completed" && (
              <>
                <button
                  onClick={isPlaying ? pause : play}
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface-elevated text-text-primary hover:bg-surface-elevated/80 transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" fill="currentColor" />
                  )}
                </button>
                <button
                  onClick={replay}
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface-elevated text-text-primary hover:bg-surface-elevated/80 transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {recordingError && (
            <div className="mt-6 p-4 rounded-xl bg-danger/10 border border-danger/20">
              <p className="text-sm text-danger text-center">
                {recordingError}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing steps */}
      {isCompleted && (
        <Card className="animate-in fade-in-up stagger-2">
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

                return (
                  <div
                    key={step}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-elevated/50 border border-border-subtle"
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="h-5 w-5 text-accent animate-spin shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-text-muted/30 shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        isDone
                          ? "text-success"
                          : isCurrent
                            ? "text-accent font-medium"
                            : "text-text-muted"
                      }`}
                    >
                      {STEP_LABELS[step]}
                    </span>
                  </div>
                )
              }
            )}

            {aiStep === "error" && (
              <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 flex items-center gap-2.5">
                <AlertCircle className="h-5 w-5 text-danger shrink-0" />
                <span className="text-sm text-danger">
                  خطا در پردازش. لطفاً دوباره تلاش کنید.
                </span>
              </div>
            )}

            {aiStep === "done" && (
              <Button
                className="w-full"
                size="lg"
                onClick={() => router.push(`/meetings/${meetingId}`)}
              >
                مشاهده نتیجه
              </Button>
            )}

            {aiStep === "error" && (
              <Button
                variant="outline"
                className="w-full"
                size="lg"
                onClick={processRecording}
              >
                تلاش مجدد
              </Button>
            )}

            {aiStep === "idle" && (
              <Button
                className="w-full"
                size="lg"
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
        <div className="animate-in fade-in-up stagger-3">
          <Button variant="ghost" className="w-full" onClick={resetRecording}>
            <RotateCcw className="h-4 w-4 ml-2" />
            ضبط مجدد
          </Button>
        </div>
      )}
    </div>
  )
}
