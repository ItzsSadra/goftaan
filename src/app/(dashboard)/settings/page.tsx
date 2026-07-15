"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  const [autoRecord, setAutoRecord] = React.useState(false)
  const [reminderMinutes, setReminderMinutes] = React.useState(10)

  return (
    <div className="flex flex-col gap-8 pb-4">
      {/* Hero */}
      <div className="flex flex-col gap-3">
        <p className="text-[12px] font-medium text-accent tracking-[0.15em] uppercase">تنظیمات</p>
        <h1 className="text-[32px] sm:text-[38px] font-semibold text-text-primary leading-tight tracking-tight">
          تنظیمات
        </h1>
        <p className="text-[15px] text-text-muted leading-relaxed">
          تنظیمات برنامه را مدیریت کنید.
        </p>
      </div>

      {/* Reminder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[16px]">یادآوری جلسه</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2.5 flex-wrap">
            {[5, 10, 15, 30, 60].map((r) => (
              <button
                key={r}
                onClick={() => setReminderMinutes(r)}
                className={`px-5 py-2.5 rounded-full text-[13px] font-medium border transition-all duration-500 cursor-pointer ${
                  reminderMinutes === r
                    ? "bg-accent text-background border-accent shadow-md shadow-accent/10"
                    : "bg-surface-elevated/30 text-text-muted border-border/30 hover:bg-surface-elevated/50 hover:text-text-secondary"
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
        <CardContent className="flex items-center justify-between py-2">
          <div>
            <p className="text-[15px] font-medium text-text-primary">ضبط خودکار</p>
            <p className="text-[13px] text-text-muted mt-1">
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
      <div className="rounded-[20px] bg-surface-elevated/20 border border-border/20 p-5">
        <p className="text-[13px] text-text-muted/70 leading-relaxed">
          تنظیمات شما در مرورگر ذخیره می\u200cشوند. برای بروزرسانی تنظیمات حساب کاربری، با مدیر تماس بگیرید.
        </p>
      </div>
    </div>
  )
}
