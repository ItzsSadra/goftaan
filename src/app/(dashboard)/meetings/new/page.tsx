"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/toast"
import { ArrowRight, Loader2 } from "lucide-react"

export default function NewMeetingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(false)

  const getDefaultStartTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 30)
    return now.toISOString().slice(0, 16)
  }

  const getDefaultEndTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 75)
    return now.toISOString().slice(0, 16)
  }

  const [title, setTitle] = React.useState("")
  const [location, setLocation] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [startAt, setStartAt] = React.useState(getDefaultStartTime())
  const [endAt, setEndAt] = React.useState(getDefaultEndTime())
  const [error, setError] = React.useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!title.trim()) {
      setError("عنوان الزامی است")
      setIsLoading(false)
      return
    }

    if (new Date(endAt) <= new Date(startAt)) {
      setError("زمان پایان باید بعد از زمان شروع باشد")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          location: location.trim(),
          notes: notes.trim(),
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
          source: "manual",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create meeting")
      }

      toast({ title: "جلسه ایجاد شد", variant: "success" })
      router.push("/meetings")
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ایجاد جلسه")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-5 sm:space-y-6">
      <div className="flex items-center gap-3 animate-in fade-in-up">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
          افزودن جلسه
        </h1>
      </div>

      <Card className="animate-in fade-in-up stagger-1 border-border bg-surface/80 backdrop-blur-xl shadow-2xl shadow-black/10">
        <CardContent className="p-5 sm:p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-danger/10 border border-danger/20">
                <p className="text-sm text-danger text-center">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">عنوان *</Label>
              <Input
                id="title"
                placeholder="عنوان جلسه"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">مکان</Label>
              <Input
                id="location"
                placeholder="مکان جلسه (اختیاری)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startAt">زمان شروع</Label>
                <Input
                  id="startAt"
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endAt">زمان پایان</Label>
                <Input
                  id="endAt"
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  dir="ltr"
                  className="text-left"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">یادداشت</Label>
              <Textarea
                id="notes"
                placeholder="یادداشت‌های اضافی (اختیاری)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "ایجاد جلسه"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
