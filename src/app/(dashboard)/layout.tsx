import { redirect } from "next/navigation"
import { getCurrentUserId } from "@/lib/supabase/server"
import { Sidebar } from "@/components/shared/sidebar"
import { ToastProvider } from "@/components/ui/toast"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userId = await getCurrentUserId()

  if (!userId) {
    redirect("/login")
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 lg:mr-0 pb-28 lg:pb-0 min-w-0">
          <div className="max-w-[720px] mx-auto px-6 sm:px-8 py-6 sm:py-10">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  )
}
