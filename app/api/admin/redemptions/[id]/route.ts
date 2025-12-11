import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const ADMIN_EMAIL = "ighanghangodspower@gmail.com"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { data: redemption, error } = await supabase
      .from("redemptions")
      .select(`
        *,
        gift_cards:gift_card_id (
          code,
          value_usd,
          recipient_name,
          design
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    return NextResponse.json({ redemption })
  } catch (error: any) {
    console.error("Error fetching redemption:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch redemption" }, { status: 500 })
  }
}
