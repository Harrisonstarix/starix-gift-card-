import { type NextRequest, NextResponse } from "next/server"
import { getShift, getStatusMessage } from "@/lib/sideshift"

export async function GET(request: NextRequest, { params }: { params: Promise<{ shiftId: string }> }) {
  try {
    const { shiftId } = await params
    const shift = await getShift(shiftId)

    return NextResponse.json({
      id: shift.id,
      status: shift.status,
      statusMessage: getStatusMessage(shift.status),
      depositAmount: shift.depositAmount,
      settleAmount: shift.settleAmount,
      depositAddress: shift.depositAddress,
      settleAddress: shift.settleAddress,
      expiresAt: shift.expiresAt,
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
