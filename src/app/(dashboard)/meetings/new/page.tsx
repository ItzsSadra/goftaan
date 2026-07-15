"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Loader2 } from "lucide-react"

export default function NewMeetingPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState("")

  const [title, setTitle] = React.useState("")
  const [location, setLocation] = React.useState("")
  const [date, setDate] = React.useState("")
  const [startTime, setStartTime] = React.useState("")
  const [endTime, setEndTime] = React.useState("")
  const [notes, setNotes] = React.useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const startAt = new Date(`${date}T${startTime}`).toISOString()
      const endAt = endTime
        ? new Date(`${date}T${endTime}`).toISOString()
        : new Date(`${date}T${startTime}`).toISOString()

      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          location: location || undefined,
          notes: notes || undefined,
          startAt,
          endAt,
          source: "manual",
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "خطا در ایجاد جلسه")
      }

      router.push("/meetings")
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ایجاد جلسه")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8 pb-4">
      {/* Header */}
      <div className="flex items-center gap-4" style={{ animation: "fade-in-up 0.6s ease-out" }}>
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <h1 className="text-[24px] sm:text-[28px] font-semibold text-text-primary tracking-tight">
          جلسه جدید
        </h1>
      </div>

      {error && (
        <div className="p-4 rounded-full bg-danger-bg border border-danger-border/30" style={{ animation: "fade-in-up 0.6s ease-out" }}>
          <p className="text-[13px] text-danger text-center">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card style={{ animation: "fade-in-up 0.6s ease-out 0.1s both" }}>
          <CardHeader>
            <CardTitle className="text-[16px]">اطلاعات جلسه</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">عنوان جلسه</Label>
              <Input
                id="title"
                placeholder="عنوان جلسه را وارد کنید"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="location">مکان (اختیاری)</Label>
              <Input
                id="location"
                placeholder="مکان جلسه"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="date">تاریخ</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="start-time">ساعت شروع</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="end-time">ساعت پایان</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">یادداشت\u200cها (اختیاری)</Label>
              <Textarea
                id="notes"
                placeholder="یادداشت\u200cهای اضافی..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin ml-2" />
          ) : null}
          ایجاد جلسه
        </Button>
      </form>
    </div>
  )
}
