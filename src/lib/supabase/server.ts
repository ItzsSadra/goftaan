import { createClient } from "@supabase/supabase-js"
import { verifyToken } from "@/lib/auth-edge"
import { cookies } from "next/headers"
import { COOKIE_NAME } from "@/lib/auth-edge"

// Supabase client for database queries only (no auth)
export function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Get current user ID from JWT cookie
export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) return null

  const payload = await verifyToken(token)
  return payload?.userId || null
}
