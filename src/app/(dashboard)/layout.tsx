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
      <div className="flex min-h-screen bg-mesh">
        <Sidebar />
        <main className="flex-1 lg:mr-0 pb-24 lg:pb-0 min-w-0">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-8 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  )
}
