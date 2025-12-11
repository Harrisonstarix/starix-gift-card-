import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"

// GET - List all user balances for admin
export async function GET() {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { data: balances, error } = await supabase
      .from("user_balances")
      .select(`
        *,
        profiles:user_id (
          email,
          full_name
        )
      `)
      .order("balance_usd", { ascending: false })
      .limit(100)

    if (error) throw error

    // Get balance transactions
    const { data: transactions } = await supabase
      .from("balance_transactions")
      .select(`
        *,
        profiles:user_id (
          email
        )
      `)
      .order("created_at", { ascending: false })
      .limit(100)

    // Stats
    const stats = {
      totalUsers: balances?.length || 0,
      totalBalance: balances?.reduce((sum, b) => sum + Number(b.balance_usd || 0), 0) || 0,
      totalDeposited: balances?.reduce((sum, b) => sum + Number(b.total_deposited || 0), 0) || 0,
      totalSpent: balances?.reduce((sum, b) => sum + Number(b.total_spent || 0), 0) || 0,
      usersWithBalance: balances?.filter((b) => Number(b.balance_usd) > 0).length || 0,
    }

    return NextResponse.json({
      balances: balances || [],
      transactions: transactions || [],
      stats,
    })
  } catch (error) {
    console.error("Failed to fetch balances:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
