import { type NextRequest, NextResponse } from "next/server"
import { createPaymentShift, createRedemptionShift, getShift } from "@/lib/sideshift"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, quoteId, settleAddress, settleMemo, refundAddress, externalId } = body

    const userIp = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1"

    let shift

    if (type === "payment") {
      shift = await createPaymentShift(quoteId, refundAddress, externalId, userIp)
    } else if (type === "redemption") {
      shift = await createRedemptionShift(quoteId, settleAddress, settleMemo, externalId, userIp)
    } else {
      return NextResponse.json({ error: "Invalid shift type" }, { status: 400 })
    }

    return NextResponse.json({
      shiftId: shift.id,
      depositAddress: shift.depositAddress,
      depositMemo: shift.depositMemo,
      depositAmount: shift.depositAmount,
      settleAmount: shift.settleAmount,
      settleAddress: shift.settleAddress,
      expiresAt: shift.expiresAt,
      status: shift.status,
      averageShiftSeconds: shift.averageShiftSeconds,
    })
  } catch (error) {
    console.error("Shift error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create shift" },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shiftId = searchParams.get("shiftId")

    if (!shiftId) {
      return NextResponse.json({ error: "Shift ID required" }, { status: 400 })
    }

    const shift = await getShift(shiftId)

    return NextResponse.json({
      shiftId: shift.id,
      status: shift.status,
      depositAddress: shift.depositAddress,
      depositAmount: shift.depositAmount,
      settleAmount: shift.settleAmount,
      settleAddress: shift.settleAddress,
      deposits: shift.deposits,
    })
  } catch (error) {
    console.error("Shift status error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get shift status" },
      { status: 500 },
    )
  }
}
