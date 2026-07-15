"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Loader2 } from "lucide-react"

interface Meeting {
  id: string
  title: string
  location: string
  notes: string
  startAt: string
  endAt: string
  source: string
  createdAt: string
}

export default function EditMeetingPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  const [title, setTitle] = React.useState("")
  const [location, setLocation] = React.useState("")
  const [date, setDate] = React.useState("")
  const [startTime, setStartTime] = React.useState("")
  const [endTime, setEndTime] = React.useState("")
  const [notes, setNotes] = React.useState("")

  React.useEffect(() => {
    fetchMeeting()
  }, [id])

  const fetchMeeting = async () => {
    try {
      const res = await fetch(`/api/meetings/${id}`)
      if (res.ok) {
        const data = await res.json()
        const m: Meeting = data.meeting
        setTitle(m.title)
        setLocation(m.location || "")
        const startDate = new Date(m.startAt)
        const endDate = new Date(m.endAt)
        setDate(startDate.toISOString().split("T")[0])
        setStartTime(startDate.toTimeString().slice(0, 5))
        setEndTime(endDate.toTimeString().slice(0, 5))
        setNotes(m.notes || "")
      }
    } catch {
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError("")

    try {
      const startAt = new Date(`${date}T${startTime}`).toISOString()
      const endAt = new Date(`${date}T${endTime}`).toISOString()

      const res = await fetch(`/api/meetings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, location: location || undefined, notes: notes || undefined, startAt, endAt }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "خطا در بروزرسانی جلسه")
      }

      router.push(`/meetings/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در بروزرسانی جلسه")
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

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8 pb-4">
      <div className="flex items-center gap-4" style={{ animation: "fade-in-up 0.6s ease-out" }}>
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <h1 className="text-[24px] sm:text-[28px] font-semibold text-text-primary tracking-tight">
          ویرایش جلسه
        </h1>
      </div>

      {error && (
        <div className="p-4 rounded-full bg-danger-bg border border-danger-border/30">
          <p className="text-[13px] text-danger text-center">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-[16px]">اطلاعات جلسه</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">عنوان جلسه</Label>
              <Input id="title" placeholder="عنوان جلسه را وارد کنید" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="location">مکان (اختیاری)</Label>
              <Input id="location" placeholder="مکان جلسه" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="date">تاریخ</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="start-time">ساعت شروع</Label>
                <Input id="start-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="end-time">ساعت پایان</Label>
                <Input id="end-time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">یادداشت\u200cها (اختیاری)</Label>
              <Textarea id="notes" placeholder="یادداشت\u200cهای اضافی..." value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[100px]" />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" disabled={isSaving} className="w-full">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
          بروزرسانی جلسه
        </Button>
      </form>
    </div>
  )
}
