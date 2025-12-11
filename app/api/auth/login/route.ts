import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logAudit } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user) {
      // Log failed attempt
      await logAudit(
        null,
        "login_failed",
        "user",
        undefined,
        { email },
        request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
        request.headers.get("user-agent") || undefined,
      )

      return NextResponse.json({ error: error?.message || "Invalid email or password" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", data.user.id).single()

    const isAdmin = profile?.is_admin || email.toLowerCase() === "ighanghangodspower@gmail.com"

    // Log successful login
    await logAudit(
      data.user.id,
      "login_success",
      "user",
      data.user.id,
      { email: data.user.email, isAdmin },
      request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      request.headers.get("user-agent") || undefined,
    )

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        isAdmin,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
