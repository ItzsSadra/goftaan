"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CenteredState } from "@/components/shared/centered-state"
import {
  ArrowRight,
  CalendarDays,
  Loader2,
  Mic,
  FileText,
  CheckCircle2,
  Save,
} from "lucide-react"

interface Meeting {
  id: string
  title: string
  startAt: string
  endAt: string
}

interface Summary {
  id: string
  meetingId: string
  transcript: string
  summary: string
  keyPoints: string[]
  actionItems: string[]
}

export default function MeetingRecordingPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [meeting, setMeeting] = React.useState<Meeting | null>(null)
  const [summary, setSummary] = React.useState<Summary | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [transcript, setTranscript] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/meetings/${id}`)
      if (res.ok) {
        const data = await res.json()
        setMeeting(data.meeting)
        setSummary(data.summary)
        setTranscript(data.summary?.transcript || "")
      }
    } catch {
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveTranscript = async () => {
    setIsSaving(true)
    try {
      await fetch("/api/summaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId: id,
          transcript,
          summary: summary?.summary || "",
          keyPoints: summary?.keyPoints || [],
          actionItems: summary?.actionItems || [],
        }),
      })
      router.push(`/meetings/${id}`)
    } catch {
    } finally {
      setIsSaving(false)
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
      <CenteredState
        icon={CalendarDays}
        title="جلسه یافت نشد"
        description="این جلسه ممکن است حذف شده باشد."
        action={
          <Button onClick={() => router.push("/meetings")}>
            بازگشت به لیست
          </Button>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-background-accent transition-colors cursor-pointer"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[20px] font-bold text-text-primary truncate">{meeting.title}</h1>
          <p className="text-[13px] text-text-secondary mt-0.5">ضبط و متن جلسه</p>
        </div>
      </div>

      {/* Existing summary display */}
      {summary?.summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[15px]">
              <CheckCircle2 className="h-4 w-4 text-success" />
              خلاصه موجود
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[14px] text-text-primary leading-7 whitespace-pre-line">{summary.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Transcript */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[15px]">
            <FileText className="h-4 w-4 text-accent" />
            متن جلسه
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Textarea
            placeholder="متن جلسه را اینجا وارد یا الصاق کنید..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="min-h-[200px] text-[14px] leading-6"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSaveTranscript}
              disabled={isSaving || !transcript.trim()}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin ml-1" />
              ) : (
                <Save className="h-4 w-4 ml-1" />
              )}
              ذخیره متن
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
