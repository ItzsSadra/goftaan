import { NextResponse } from "next/server"
import { getDb } from "@/lib/supabase/server"
import { hashPassword, createToken, COOKIE_NAME } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    const db = getDb()

    // Check if email already exists
    const { data: existing } = await db
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .single()

    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(password)

    const { data: user, error } = await db
      .from("users")
      .insert({
        name: name || "",
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
      })
      .select("id, name, email")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const token = await createToken(user.id)

    const response = NextResponse.json(
      { user: { id: user.id, name: user.name, email: user.email } },
      { status: 201 }
    )

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
