"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"

export default function SettingsPage() {
  const [autoRecord, setAutoRecord] = React.useState(false)
  const [reminderMinutes, setReminderMinutes] = React.useState(10)

  return (
    <div className="flex flex-col gap-5 pb-4">
      {/* Hero */}
      <div className="rounded-[20px] bg-surface border border-border p-5 sm:p-6 flex flex-col gap-2">
        <p className="text-[13px] font-bold text-accent">تنظیمات</p>
        <h1 className="text-[26px] sm:text-[30px] font-bold text-text-primary leading-10">
          تنظیمات
        </h1>
        <p className="text-[14px] text-text-secondary leading-5">
          تنظیمات برنامه را مدیریت کنید.
        </p>
      </div>

      {/* Reminder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[15px]">یادآوری جلسه</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {[5, 10, 15, 30, 60].map((r) => (
              <button
                key={r}
                onClick={() => setReminderMinutes(r)}
                className={`px-4 py-2.5 rounded-xl text-[13px] font-bold border transition-all duration-200 cursor-pointer ${
                  reminderMinutes === r
                    ? "bg-accent text-white border-accent"
                    : "bg-surface text-text-secondary border-border hover:bg-background-accent"
                }`}
              >
                {r} دقیقه قبل
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Auto record */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="text-[14px] font-bold text-text-primary">ضبط خودکار</p>
            <p className="text-[12px] text-text-secondary mt-0.5">
              ضبط خودکار جلسات را فعال کنید.
            </p>
          </div>
          <Switch
            checked={autoRecord}
            onCheckedChange={setAutoRecord}
          />
        </CardContent>
      </Card>

      {/* Info */}
      <div className="rounded-[14px] bg-background-accent border border-border p-4">
        <p className="text-[13px] text-text-secondary leading-5">
          تنظیمات شما در مرورگر ذخیره می‌شوند. برای بروزرسانی تنظیمات حساب کاربری، با مدیر تماس بگیرید.
        </p>
      </div>
    </div>
  )
}
