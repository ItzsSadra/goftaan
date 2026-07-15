"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/toast"
import { useAudioRecorder } from "@/hooks/use-audio-recorder"
import { formatMeetingTime, formatDuration } from "@/lib/utils"
import type { Meeting } from "@/types"
import {
  ArrowRight,
  Loader2,
  Mic,
  Pause,
  Play,
  Square,
  Save,
  RotateCcw,
  CheckCircle2,
  FileText,
  Clock,
} from "lucide-react"

export default function MeetingRecordingPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { toast } = useToast()

  const [meeting, setMeeting] = React.useState<Meeting | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [title, setTitle] = React.useState("")
  const [manualTranscript, setManualTranscript] = React.useState("")
  const [isSavingRecording, setIsSavingRecording] = React.useState(false)
  const [isSavingTranscript, setIsSavingTranscript] = React.useState(false)
  const [processStatus, setProcessStatus] = React.useState<string | null>(null)

  const {
    status,
    audioBlob,
    duration,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    error: recordingError,
  } = useAudioRecorder()

  React.useEffect(() => {
    async function loadMeeting() {
      try {
        const res = await fetch(`/api/meetings/${id}`)
        if (res.ok) {
          const data = await res.json()
          setMeeting(data.meeting)
        }
      } catch {
      } finally {
        setIsLoading(false)
      }
    }
    loadMeeting()
  }, [id])

  const handleSaveRecording = async () => {
    if (!audioBlob) return
    setIsSavingRecording(true)
    setProcessStatus("در حال آپلود صدا...")
    try {
      const formData = new FormData()
      formData.append("audio", audioBlob, "recording.webm")
      formData.append("meetingId", id)
      formData.append("title", title || `ضبط ${new Date().toLocaleTimeString("fa-IR")}`)
      formData.append("durationSeconds", String(Math.floor(duration / 1000)))

      setProcessStatus("در حال پیاده\u200cسازی متن...")
      const res = await fetch("/api/process-recording", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) throw new Error("Failed to save recording")

      setProcessStatus("در حال خلاصه\u200cسازی...")
      toast({ title: "ضبط با موفقیت ذخیره شد", variant: "success" })
      router.push(`/meetings/${id}`)
    } catch {
      toast({ title: "خطا در ذخیره ضبط", variant: "destructive" })
      setProcessStatus(null)
    } finally {
      setIsSavingRecording(false)
    }
  }

  const handleSaveTranscript = async () => {
    setIsSavingTranscript(true)
    try {
      const res = await fetch("/api/summaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId: id,
          title: title || `متن دستی ${new Date().toLocaleTimeString("fa-IR")}`,
          transcript: manualTranscript,
          summary: "",
          keyPoints: [],
          actionItems: [],
          durationSeconds: 0,
        }),
      })

      if (!res.ok) throw new Error("Failed to save")
      toast({ title: "متن ذخیره شد", variant: "success" })
      router.push(`/meetings/${id}`)
    } catch {
      toast({ title: "خطا در ذخیره متن", variant: "destructive" })
    } finally {
      setIsSavingTranscript(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="text-center py-32">
        <p className="text-text-muted">جلسه یافت نشد</p>
        <Button variant="ghost" onClick={() => router.push("/meetings")} className="mt-4">
          بازگشت
        </Button>
      </div>
    )
  }

  const isRecording = status === "recording"
  const isPaused = status === "paused"
  const isCompleted = status === "completed"
  const isProcessing = isSavingRecording

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4" style={{ animation: "fade-in-up 0.6s ease-out" }}>
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[24px] sm:text-[28px] font-semibold text-text-primary tracking-tight truncate">
            {meeting.title}
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[13px] text-text-muted flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 opacity-50" />
              {formatMeetingTime(meeting.startAt, meeting.endAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Title input */}
      <Card style={{ animation: "fade-in-up 0.6s ease-out 0.1s both" }}>
        <CardContent className="p-6">
          <Label htmlFor="recording-title" className="mb-3 block">
            عنوان ضبط
          </Label>
          <Input
            id="recording-title"
            placeholder="مثلاً: مرور پروژه، تصمیم\u200cگیری بودجه..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Audio Recorder */}
      <Card style={{ animation: "fade-in-up 0.6s ease-out 0.15s both" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-[16px]">
            <Mic className="h-4 w-4 text-accent" />
            ضبط صدا
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center py-8">
            {!isRecording && !isPaused && !isCompleted && (
              <button
                onClick={startRecording}
                disabled={status === "requestingPermission"}
                className="relative flex h-28 w-28 items-center justify-center rounded-full bg-accent/8 border border-accent/10 hover:bg-accent/12 hover:border-accent/15 transition-all duration-700 cursor-pointer active:scale-95"
              >
                <Mic className="h-12 w-12 text-accent/70" />
                <span className="absolute -bottom-8 text-[12px] text-text-muted/60">
                  {status === "requestingPermission" ? "درخواست دسترسی..." : "لمس برای شروع"}
                </span>
              </button>
            )}

            {(isRecording || isPaused) && (
              <div className="flex flex-col items-center gap-5">
                <div className="relative">
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-danger/8 border border-danger/15">
                    <Mic className="h-12 w-12 text-danger/70" />
                  </div>
                  {isRecording && (
                    <span className="absolute inset-0 rounded-full bg-danger/10 animate-[pulse-soft_3s_ease-in-out_infinite]" />
                  )}
                </div>

                <p className="text-4xl font-light text-text-primary tracking-wider font-mono">
                  {formatDuration(duration)}
                </p>

                <p className="text-[12px] text-text-muted/50 tracking-wide">
                  {isRecording ? "در حال ضبط..." : "متوقف شده"}
                </p>

                <div className="flex items-center gap-4 mt-2">
                  {isRecording ? (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-13 w-13 rounded-full"
                      onClick={pauseRecording}
                    >
                      <Pause className="h-5 w-5" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-13 w-13 rounded-full"
                      onClick={resumeRecording}
                    >
                      <Play className="h-5 w-5" />
                    </Button>
                  )}

                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-13 w-13 rounded-full"
                    onClick={stopRecording}
                  >
                    <Square className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {isCompleted && (
              <div className="flex flex-col items-center gap-5 w-full">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/8 border border-success/15">
                  <CheckCircle2 className="h-10 w-10 text-success/70" />
                </div>

                <div className="text-center">
                  <p className="text-[15px] font-medium text-text-primary">ضبط کامل شد</p>
                  <p className="text-[12px] text-text-muted/50 mt-1">
                    مدت زمان: {formatDuration(duration)}
                  </p>
                </div>

                {processStatus && (
                  <p className="text-[12px] text-accent/70 animate-pulse tracking-wide">{processStatus}</p>
                )}

                <div className="flex items-center gap-3 w-full max-w-xs">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={resetRecording}
                    disabled={isProcessing}
                  >
                    <RotateCcw className="h-4 w-4 ml-2" />
                    ضبط مجدد
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSaveRecording}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                      <Save className="h-4 w-4 ml-2" />
                    )}
                    ذخیره و پردازش
                  </Button>
                </div>
              </div>
            )}

            {recordingError && (
              <p className="text-[12px] text-danger/70 mt-4">{recordingError}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Manual transcript */}
      <Card style={{ animation: "fade-in-up 0.6s ease-out 0.2s both" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-[16px]">
            <FileText className="h-4 w-4 text-text-muted/50" />
            یا متن را دستی وارد کنید
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <Textarea
            placeholder="متن جلسه را اینجا وارد یا الصاق کنید..."
            value={manualTranscript}
            onChange={(e) => setManualTranscript(e.target.value)}
            className="min-h-[160px] text-[14px] leading-relaxed"
          />
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleSaveTranscript}
              disabled={isSavingTranscript || !manualTranscript.trim()}
            >
              {isSavingTranscript ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Save className="h-4 w-4 ml-2" />
              )}
              ذخیره متن
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
