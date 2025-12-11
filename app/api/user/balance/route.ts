import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { getUserBalance } from "@/lib/balance"

// GET - Get current user's balance
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const balance = await getUserBalance(user.id)

    // Get recent transactions
    const supabase = await createClient()
    const { data: transactions } = await supabase
      .from("balance_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)

    return NextResponse.json({
      balance: balance.balance_usd,
      totalDeposited: balance.total_deposited,
      totalSpent: balance.total_spent,
      transactions: transactions || [],
    })
  } catch (error) {
    console.error("Failed to fetch balance:", error)
    return NextResponse.json({ error: "Failed to fetch balance" }, { status: 500 })
  }
}
