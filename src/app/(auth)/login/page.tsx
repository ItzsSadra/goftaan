"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  const [loginEmail, setLoginEmail] = React.useState("")
  const [loginPassword, setLoginPassword] = React.useState("")

  const [signupName, setSignupName] = React.useState("")
  const [signupEmail, setSignupEmail] = React.useState("")
  const [signupPassword, setSignupPassword] = React.useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      router.push("/meetings")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Signup failed")
      }

      router.push("/meetings")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-accent/[0.02] rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-[380px] flex flex-col items-center gap-10 relative">
        {/* Brand */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent font-semibold text-[18px]">
            گ
          </div>
          <div className="text-center">
            <span className="text-[28px] font-semibold text-text-primary tracking-tight block">
              گفتان
            </span>
            <span className="text-[14px] text-text-muted tracking-wide">
              مدیریت هوشمند جلسات
            </span>
          </div>
        </div>

        <Card className="w-full border-border/30">
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-[22px] font-semibold text-text-primary tracking-tight">
                خوش آمدید
              </h2>
              <p className="text-[14px] text-text-muted leading-relaxed">
                به حساب خود وارد شوید.
              </p>
            </div>

            <Tabs defaultValue="login">
              <TabsList className="w-full">
                <TabsTrigger value="login" className="flex-1">ورود</TabsTrigger>
                <TabsTrigger value="signup" className="flex-1">ثبت\u200cنام</TabsTrigger>
              </TabsList>

              {error && (
                <div className="p-3.5 rounded-full bg-danger-bg border border-danger-border/30 mt-1">
                  <p className="text-[13px] text-danger text-center">{error}</p>
                </div>
              )}

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="login-email">ایمیل</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      dir="ltr"
                      className="text-left"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="login-password">رمز عبور</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      dir="ltr"
                      className="text-left"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-2"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "ورود"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="signup-name">نام</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="نام شما"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="signup-email">ایمیل</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      dir="ltr"
                      className="text-left"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="signup-password">رمز عبور</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      minLength={6}
                      dir="ltr"
                      className="text-left"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-2"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "ثبت\u200cنام"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Subtle footer text */}
        <p className="text-[12px] text-text-muted/50 tracking-wide">
          تجربه\u200cای متفاوت در مدیریت جلسات
        </p>
      </div>
    </div>
  )
}
