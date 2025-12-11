import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)

    if (error) throw error

    const giftCardIds = [...new Set((transactions || []).map((t) => t.gift_card_id).filter(Boolean))]
    let giftCardsMap: Record<
      string,
      { code: string; value_usd: number; buyer_email: string | null; created_by: string | null }
    > = {}

    if (giftCardIds.length > 0) {
      const { data: cards } = await supabase
        .from("gift_cards")
        .select("id, code, value_usd, buyer_email, created_by")
        .in("id", giftCardIds)

      if (cards) {
        giftCardsMap = cards.reduce(
          (acc, c) => {
            acc[c.id] = { code: c.code, value_usd: c.value_usd, buyer_email: c.buyer_email, created_by: c.created_by }
            return acc
          },
          {} as Record<
            string,
            { code: string; value_usd: number; buyer_email: string | null; created_by: string | null }
          >,
        )
      }
    }

    const userIds = [...new Set((transactions || []).map((t) => t.user_id).filter(Boolean))]
    let usersMap: Record<string, { email: string; full_name: string | null }> = {}

    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("id, email, full_name").in("id", userIds)

      if (profiles) {
        usersMap = profiles.reduce(
          (acc, p) => {
            acc[p.id] = { email: p.email, full_name: p.full_name }
            return acc
          },
          {} as Record<string, { email: string; full_name: string | null }>,
        )
      }
    }

    const { data: allTx } = await supabase.from("transactions").select("type, status")

    const stats = {
      totalPurchases: allTx?.filter((t) => t.type === "purchase").length || 0,
      totalRedemptions: allTx?.filter((t) => t.type === "redemption").length || 0,
      totalDeposits: allTx?.filter((t) => t.type === "deposit").length || 0,
      pendingTransactions: allTx?.filter((t) => ["pending", "waiting", "processing"].includes(t.status)).length || 0,
      failedTransactions: allTx?.filter((t) => ["failed", "cancelled", "expired"].includes(t.status)).length || 0,
      purchaseVolume: 0,
      redemptionVolume: 0,
    }

    return NextResponse.json({
      transactions: (transactions || []).map((t) => ({
        ...t,
        gift_card_code: t.gift_card_id ? giftCardsMap[t.gift_card_id]?.code : null,
        gift_card_value: t.gift_card_id ? giftCardsMap[t.gift_card_id]?.value_usd : null,
        user: t.user_id ? usersMap[t.user_id] : null,
      })),
      stats,
    })
  } catch (error) {
    console.error("Failed to fetch transactions:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
