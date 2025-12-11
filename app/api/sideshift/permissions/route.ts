import { type NextRequest, NextResponse } from "next/server"
import { checkPermissions } from "@/lib/sideshift"

export async function GET(request: NextRequest) {
  try {
    const userIp = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1"
    const permissions = await checkPermissions(userIp)

    return NextResponse.json(permissions)
  } catch (error) {
    console.error("Permissions check error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check permissions" },
      { status: 500 },
    )
  }
}
