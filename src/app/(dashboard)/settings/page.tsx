"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/toast"
import type { RecordingSettings } from "@/types"
import { DEFAULT_SETTINGS } from "@/types"
import {
  User,
  Bell,
  Settings as SettingsIcon,
  Trash2,
  LogOut,
  Loader2,
  Save,
  Lock,
} from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [userId, setUserId] = React.useState<string | null>(null)
  const [profile, setProfile] = React.useState({ name: "", email: "" })
  const [settings, setSettings] = React.useState<RecordingSettings>(DEFAULT_SETTINGS)
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [isChangingPassword, setIsChangingPassword] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadData() {
      try {
        // Get current user from API
        const res = await fetch("/api/auth/me")
        if (res.ok) {
          const data = await res.json()
          setUserId(data.user.id)
          setProfile({ name: data.user.name, email: data.user.email })
        }
      } catch {
        // Not logged in
      }

      // Load settings from localStorage
      const saved = localStorage.getItem("goftaan.settings.v1")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setSettings({ ...DEFAULT_SETTINGS, ...parsed })
        } catch {
          // Use defaults
        }
      }

      setIsLoading(false)
    }

    loadData()
  }, [])

  const saveSettings = (newSettings: RecordingSettings) => {
    setSettings(newSettings)
    localStorage.setItem("goftaan.settings.v1", JSON.stringify(newSettings))
  }

  const handleSaveProfile = async () => {
    if (!userId) return
    setIsSaving(true)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
        }),
      })

      if (!response.ok) throw new Error("Failed to update profile")

      toast({ title: "پروفایل ذخیره شد", variant: "success" })
    } catch {
      toast({ title: "خطا در ذخیره پروفایل", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!userId) return
    if (!newPassword || !confirmPassword) {
      toast({ title: "رمز عبور را وارد کنید", variant: "destructive" })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "رمزهای عبور مطابقت ندارند", variant: "destructive" })
      return
    }
    if (newPassword.length < 6) {
      toast({ title: "رمز عبور باید حداقل ۶ کاراکتر باشد", variant: "destructive" })
      return
    }

    setIsChangingPassword(true)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      })

      if (!response.ok) throw new Error("Failed to change password")

      toast({ title: "رمز عبور تغییر کرد", variant: "success" })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch {
      toast({ title: "خطا در تغییر رمز عبور", variant: "destructive" })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  const handleDeleteAccount = async () => {
    if (!userId) return
    if (!confirm("آیا از حذف حساب کاربری اطمینان دارید؟ این عمل غیرقابل بازگشت است."))
      return

    try {
      await fetch(`/api/users/${userId}`, { method: "DELETE" })
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
    } catch {
      toast({ title: "خطا در حذف حساب", variant: "destructive" })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">تنظیمات</h1>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-5 w-5 text-indigo-600" />
            حساب کاربری
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">نام</Label>
            <Input
              id="name"
              value={profile.name}
              onChange={(e) =>
                setProfile({ ...profile, name: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">ایمیل</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) =>
                setProfile({ ...profile, email: e.target.value })
              }
              dir="ltr"
            />
          </div>
          <Button onClick={handleSaveProfile} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4 ml-2" />
                ذخیره
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-5 w-5 text-amber-600" />
            تغییر رمز عبور
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">رمز عبور جدید</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">تکرار رمز عبور</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              dir="ltr"
            />
          </div>
          <Button onClick={handleChangePassword} disabled={isChangingPassword}>
            {isChangingPassword ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Lock className="h-4 w-4 ml-2" />
                تغییر رمز عبور
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* App Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <SettingsIcon className="h-5 w-5 text-purple-600" />
            تنظیمات برنامه
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                بروزرسانی خودکار جلسات
              </p>
              <p className="text-xs text-gray-500">
                لیست جلسات خودکار بروز شود
              </p>
            </div>
            <Switch
              checked={settings.app.autoRefreshMeetings}
              onCheckedChange={(v) =>
                saveSettings({
                  ...settings,
                  app: { ...settings.app, autoRefreshMeetings: v },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                کارت‌های فشرده
              </p>
              <p className="text-xs text-gray-500">
                نمایش فشرده‌تر کارت جلسات
              </p>
            </div>
            <Switch
              checked={settings.app.compactCards}
              onCheckedChange={(v) =>
                saveSettings({
                  ...settings,
                  app: { ...settings.app, compactCards: v },
                })
              }
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-900">
              مدت پیش‌فرض جلسه (دقیقه)
            </Label>
            <div className="flex gap-2 mt-2">
              {[30, 45, 60, 90].map((min) => (
                <Button
                  key={min}
                  variant={
                    settings.app.defaultMeetingDurationMinutes === min
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    saveSettings({
                      ...settings,
                      app: {
                        ...settings.app,
                        defaultMeetingDurationMinutes: min,
                      },
                    })
                  }
                >
                  {min}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-5 w-5 text-amber-600" />
            یادآوری‌ها
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                یادآوری قبل از جلسه
              </p>
              <p className="text-xs text-gray-500">
                {settings.reminders.preMeetingMinutes} دقیقه قبل
              </p>
            </div>
            <Switch
              checked={settings.reminders.preMeetingEnabled}
              onCheckedChange={(v) =>
                saveSettings({
                  ...settings,
                  reminders: { ...settings.reminders, preMeetingEnabled: v },
                })
              }
            />
          </div>

          {settings.reminders.preMeetingEnabled && (
            <div>
              <Label className="text-xs text-gray-500">زمان یادآوری</Label>
              <div className="flex gap-2 mt-1">
                {[5, 10, 15, 30].map((min) => (
                  <Button
                    key={min}
                    variant={
                      settings.reminders.preMeetingMinutes === min
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      saveSettings({
                        ...settings,
                        reminders: {
                          ...settings.reminders,
                          preMeetingMinutes: min,
                        },
                      })
                    }
                  >
                    {min} دقیقه
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                اعلان آماده شدن خلاصه
              </p>
            </div>
            <Switch
              checked={settings.reminders.summaryReadyEnabled}
              onCheckedChange={(v) =>
                saveSettings({
                  ...settings,
                  reminders: {
                    ...settings.reminders,
                    summaryReadyEnabled: v,
                  },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                اعلان اقدامات معوق
              </p>
            </div>
            <Switch
              checked={settings.reminders.overdueActionsEnabled}
              onCheckedChange={(v) =>
                saveSettings({
                  ...settings,
                  reminders: {
                    ...settings.reminders,
                    overdueActionsEnabled: v,
                  },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-base text-red-600">ناحیه خطر</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="h-4 w-4 ml-2" />
            خروج از حساب
          </Button>
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleDeleteAccount}
          >
            <Trash2 className="h-4 w-4 ml-2" />
            حذف دائم حساب کاربری
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
