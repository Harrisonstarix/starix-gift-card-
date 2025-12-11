import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin, logAudit } from "@/lib/auth"

// GET - Get current treasury wallet (only ONE allowed)
export async function GET() {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { data: wallet, error } = await supabase
      .from("admin_wallets")
      .select("id, asset, network, address, is_primary, created_at")
      .eq("is_primary", true)
      .single()

    if (error && error.code !== "PGRST116") throw error

    return NextResponse.json({ wallet: wallet || null })
  } catch (error) {
    console.error("Failed to fetch wallet:", error)
    return NextResponse.json({ error: "Unauthorized or failed to fetch wallet" }, { status: 401 })
  }
}

// POST - Set treasury wallet (must delete existing first)
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    const supabase = await createClient()
    const { asset, network, address } = await request.json()

    if (!asset || !network || !address) {
      return NextResponse.json({ error: "Asset, network, and address are required" }, { status: 400 })
    }

    const { data: existingWallet } = await supabase.from("admin_wallets").select("id").eq("is_primary", true).single()

    if (existingWallet) {
      return NextResponse.json(
        { error: "A treasury wallet already exists. Delete it first before adding a new one." },
        { status: 400 },
      )
    }

    // Create new treasury wallet
    const { data: wallet, error } = await supabase
      .from("admin_wallets")
      .insert({
        asset: asset.toLowerCase(),
        network: network.toLowerCase(),
        address,
        is_primary: true,
      })
      .select()
      .single()

    if (error) throw error

    // Also update admin_settings for compatibility
    await supabase.from("admin_settings").upsert(
      [
        { key: "treasury_asset", value: asset.toLowerCase() },
        { key: "treasury_network", value: network.toLowerCase() },
        { key: "treasury_address", value: address },
      ],
      { onConflict: "key" },
    )

    await logAudit(admin.id, "treasury_wallet_added", "admin_wallet", wallet?.id, {
      asset,
      network,
      address: `${address.slice(0, 8)}...${address.slice(-6)}`,
    })

    return NextResponse.json({ wallet })
  } catch (error) {
    console.error("Failed to add wallet:", error)
    return NextResponse.json({ error: "Failed to add wallet" }, { status: 500 })
  }
}

// DELETE - Remove treasury wallet
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    const supabase = await createClient()

    const { data: wallet } = await supabase
      .from("admin_wallets")
      .select("id, asset, network")
      .eq("is_primary", true)
      .single()

    if (!wallet) {
      return NextResponse.json({ error: "No treasury wallet found" }, { status: 404 })
    }

    const { error } = await supabase.from("admin_wallets").delete().eq("id", wallet.id)

    if (error) throw error

    // Clear admin_settings as well
    await supabase.from("admin_settings").delete().in("key", ["treasury_asset", "treasury_network", "treasury_address"])

    await logAudit(admin.id, "treasury_wallet_removed", "admin_wallet", wallet.id, {
      asset: wallet.asset,
      network: wallet.network,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete wallet:", error)
    return NextResponse.json({ error: "Failed to delete wallet" }, { status: 500 })
  }
}
