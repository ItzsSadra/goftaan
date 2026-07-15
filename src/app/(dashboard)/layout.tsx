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
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 lg:mr-0 pb-20 lg:pb-0">
          <div className="max-w-4xl mx-auto px-4 py-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  )
}
