import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    // Get gift cards purchased by this user
    const { data: giftCards } = await supabase
      .from("gift_cards")
      .select(
        `
        id, code, value_usd, design, status,
        recipient_name, recipient_email, sender_name, message,
        payment_crypto, payment_network, payment_amount, payment_tx_hash,
        platform_fee_usd, total_paid_usd,
        created_at, expires_at
      `,
      )
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })
      .limit(100)

    const { data: transactions } = await supabase
      .from("transactions")
      .select(
        `
        id, type, gift_card_id, 
        deposit_coin, deposit_network, deposit_amount,
        settle_coin, settle_network, settle_amount,
        status, tx_hash, sideshift_id, quote_id,
        created_at
      `,
      )
      .in("gift_card_id", giftCards?.map((c) => c.id) || [])
      .order("created_at", { ascending: false })
      .limit(100)

    // Map transactions with gift card info
    const transactionsWithCards =
      transactions?.map((tx) => {
        const card = giftCards?.find((c) => c.id === tx.gift_card_id)
        return {
          ...tx,
          gift_card_code: card?.code,
          gift_card_value: card?.value_usd,
        }
      }) || []

    // Calculate stats
    const totalPurchased = giftCards?.length || 0
    const totalValue = giftCards?.reduce((sum, card) => sum + Number(card.value_usd || 0), 0) || 0
    const activeCards = giftCards?.filter((c) => c.status === "active").length || 0
    const redeemedCards = giftCards?.filter((c) => c.status === "redeemed").length || 0

    return NextResponse.json({
      giftCards:
        giftCards?.map((card) => ({
          id: card.id,
          code: card.code,
          value_usd: card.value_usd,
          design: card.design || "obsidian",
          status: card.status,
          recipient_name: card.recipient_name,
          recipient_email: card.recipient_email,
          sender_name: card.sender_name,
          message: card.message,
          payment_crypto: card.payment_crypto,
          payment_amount: card.payment_amount,
          payment_tx_hash: card.payment_tx_hash,
          platform_fee_usd: card.platform_fee_usd,
          total_paid_usd: card.total_paid_usd,
          created_at: card.created_at,
          expires_at: card.expires_at,
        })) || [],
      transactions: transactionsWithCards,
      stats: {
        totalPurchased,
        totalValue,
        activeCards,
        redeemedCards,
      },
    })
  } catch (error) {
    console.error("Failed to fetch user gift cards:", error)
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
  }
}
