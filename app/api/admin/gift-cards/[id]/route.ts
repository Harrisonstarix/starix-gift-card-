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
    const { data: card, error } = await supabase
      .from("gift_cards")
      .select(`
        *,
        profiles:created_by (
          email,
          full_name
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    // Get redemption info if redeemed
    let redemption = null
    if (card.status === "redeemed") {
      const { data: redemptionData } = await supabase.from("redemptions").select("*").eq("gift_card_id", id).single()
      redemption = redemptionData
    }

    return NextResponse.json({ card, redemption })
  } catch (error: any) {
    console.error("Error fetching gift card:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch gift card" }, { status: 500 })
  }
}
