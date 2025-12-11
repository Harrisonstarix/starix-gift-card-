import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logAudit } from "@/lib/auth"

const ADMIN_EMAIL = "ighanghangodspower@gmail.com"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const supabase = await createClient()
    const isAdminEmail = email.toLowerCase() === ADMIN_EMAIL.toLowerCase()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${request.headers.get("origin") || ""}/auth/callback`,
        data: {
          is_admin: isAdminEmail,
        },
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data.user) {
      return NextResponse.json({ error: "Failed to create account" }, { status: 400 })
    }

    // Log registration
    await logAudit(
      data.user.id,
      isAdminEmail ? "admin_registered" : "user_registered",
      "user",
      data.user.id,
      { email: data.user.email, isAdmin: isAdminEmail },
      request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      request.headers.get("user-agent") || undefined,
    )

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        isAdmin: isAdminEmail,
      },
      message: "Please check your email to confirm your account",
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
