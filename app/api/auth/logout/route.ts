import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser, logAudit } from "@/lib/auth"

export async function POST() {
  try {
    const user = await getCurrentUser()
    const supabase = await createClient()

    await supabase.auth.signOut()

    if (user) {
      await logAudit(user.id, "logout", "user", user.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
