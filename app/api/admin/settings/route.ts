import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin, logAudit } from "@/lib/auth"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: settings } = await supabase.from("admin_settings").select("key, value")

    const settingsMap: Record<string, any> = {}
    settings?.forEach((row) => {
      settingsMap[row.key] = row.value
    })

    // Get treasury wallet
    const { data: wallet } = await supabase
      .from("admin_wallets")
      .select("asset, network, address")
      .eq("is_primary", true)
      .single()

    return NextResponse.json({
      settings: {
        // Treasury wallet
        treasuryAsset: wallet?.asset || null,
        treasuryNetwork: wallet?.network || null,
        treasuryAddress: wallet?.address || null,
        hasTreasuryWallet: !!wallet,

        feePercentage: Number(settingsMap.fee_percentage) || 2.5,
        feeMinimum: Number(settingsMap.fee_minimum) || 0.5,

        // Gift card settings
        giftCardExpiryDays: Number(settingsMap.gift_card_expiry_days) || 90,
        minGiftCardValue: Number(settingsMap.min_gift_card_value) || 5,
        maxGiftCardValue: Number(settingsMap.max_gift_card_value) || 100000,

        // Deposit settings
        minDepositValue: Number(settingsMap.min_deposit_value) || 5,
        maxDepositValue: Number(settingsMap.max_deposit_value) || 100000,

        // Processing
        autoProcessRedemptions: settingsMap.auto_process_redemptions === true,
      },
    })
  } catch (error) {
    console.error("Failed to fetch settings:", error)
    return NextResponse.json({
      settings: {
        treasuryAsset: null,
        treasuryNetwork: null,
        treasuryAddress: null,
        hasTreasuryWallet: false,
        feePercentage: 2.5,
        feeMinimum: 0.5,
        giftCardExpiryDays: 90,
        minGiftCardValue: 5,
        maxGiftCardValue: 100000,
        minDepositValue: 5,
        maxDepositValue: 100000,
        autoProcessRedemptions: false,
      },
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    const supabase = await createClient()
    const body = await request.json()

    const updates = [
      { key: "fee_percentage", value: Number(body.feePercentage) || 2.5 },
      { key: "fee_minimum", value: Number(body.feeMinimum) || 0.5 },
      { key: "gift_card_expiry_days", value: Number(body.giftCardExpiryDays) || 90 },
      { key: "min_gift_card_value", value: Number(body.minGiftCardValue) || 5 },
      { key: "max_gift_card_value", value: Number(body.maxGiftCardValue) || 100000 },
      { key: "min_deposit_value", value: Number(body.minDepositValue) || 5 },
      { key: "max_deposit_value", value: Number(body.maxDepositValue) || 100000 },
      { key: "auto_process_redemptions", value: Boolean(body.autoProcessRedemptions) },
    ]

    for (const { key, value } of updates) {
      const { error } = await supabase
        .from("admin_settings")
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" })

      if (error) {
        console.error(`Failed to save setting ${key}:`, error)
        throw error
      }
    }

    await logAudit(admin.id, "settings_updated", "admin_settings", undefined, {
      feePercentage: body.feePercentage,
      feeMinimum: body.feeMinimum,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to save settings:", error)
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}
