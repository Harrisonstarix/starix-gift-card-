import { Resend } from "resend"
import { getDesignById, getDefaultDesign, type CardDesignConfig } from "@/lib/card-designs"

// Initialize Resend - server-side only
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "ighanghangodspower@gmail.com"
const FROM_EMAIL = process.env.FROM_EMAIL || "Starix <noreply@send.starix.uswc.xyz>"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://starix.uswc.xyz"

function getAbsoluteImageUrl(imagePath: string | undefined): string {
  if (!imagePath) return `${SITE_URL}/starix-logo.png`
  if (imagePath.startsWith("http")) return imagePath
  const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath
  return `${SITE_URL}/${cleanPath}`
}

// ============================================================
// BASE EMAIL TEMPLATE
// ============================================================

function getBaseTemplate(content: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #000000;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #111111; border-radius: 24px; overflow: hidden;">
          <tr>
            <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #222222;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <img src="${SITE_URL}/starix-logo.png" alt="Starix" width="48" height="48" style="display: block; border-radius: 12px;">
                  </td>
                  <td style="vertical-align: middle; padding-left: 16px;">
                    <span style="color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Starix</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; background-color: #0a0a0a; border-top: 1px solid #222222;">
              <p style="color: #666666; font-size: 13px; margin: 0 0 8px 0;">Starix - Premium Crypto Gift Cards</p>
              <p style="margin: 0;"><a href="${SITE_URL}" style="color: #22c55e; text-decoration: none;">starix.uswc.xyz</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ============================================================
// GIFT CARD EMAIL - LARGE IMAGE FIRST
// ============================================================

function buildGiftCardHTML(
  value: number,
  code: string,
  recipientName: string,
  senderName: string,
  message: string,
  design: CardDesignConfig,
): string {
  const cardImageUrl = getAbsoluteImageUrl(design.image)

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <span style="display: inline-block; background-color: #22c55e20; color: #22c55e; font-size: 14px; font-weight: 600; padding: 10px 24px; border-radius: 50px;">You received a gift!</span>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-bottom: 32px;">
          <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 8px 0;">${senderName || "Someone"} sent you a $${value} gift card!</h1>
          <p style="color: #888888; font-size: 16px; margin: 0;">Redeem it for any cryptocurrency</p>
        </td>
      </tr>
    </table>

    <!-- LARGE CARD IMAGE -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
      <tr>
        <td align="center">
          <img src="${cardImageUrl}" alt="${design.name}" width="536" style="display: block; width: 100%; max-width: 536px; height: auto; border-radius: 16px; border: 3px solid #333333;">
        </td>
      </tr>
    </table>

    <!-- Card Value Badge -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
      <tr>
        <td align="center">
          <table cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #1a1a1a, #0d0d0d); border-radius: 16px; border: 2px solid #333333;">
            <tr>
              <td style="padding: 24px 48px; text-align: center;">
                <p style="color: #888888; font-size: 14px; margin: 0 0 8px 0;">${design.name}</p>
                <span style="color: #ffffff; font-size: 56px; font-weight: 700;">$${value}</span>
                <p style="color: #22c55e; font-size: 16px; font-weight: 500; margin: 8px 0 0 0;">Gift Card</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${
      message
        ? `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
      <tr>
        <td style="background-color: #1a1a1a; border-radius: 16px; padding: 24px; border-left: 4px solid #22c55e;">
          <p style="color: #888888; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Message from ${senderName || "sender"}</p>
          <p style="color: #ffffff; font-size: 18px; margin: 0; font-style: italic;">"${message}"</p>
        </td>
      </tr>
    </table>
    `
        : ""
    }

    <!-- Redemption Code -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
      <tr>
        <td align="center" style="background: linear-gradient(135deg, #22c55e15, #16a34a10); border: 2px solid #22c55e50; border-radius: 20px; padding: 32px;">
          <p style="color: #22c55e; font-size: 12px; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">Your Redemption Code</p>
          <table cellpadding="0" cellspacing="0" border="0" style="background-color: #0a0a0a; border-radius: 12px;">
            <tr>
              <td style="padding: 20px 32px;">
                <span style="color: #ffffff; font-size: 28px; font-family: monospace; letter-spacing: 4px; font-weight: 600;">${code}</span>
              </td>
            </tr>
          </table>
          <p style="color: #666666; font-size: 14px; margin: 20px 0 0 0;">Enter at <a href="${SITE_URL}/redeem" style="color: #22c55e; text-decoration: none;">starix.uswc.xyz/redeem</a></p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center">
          <a href="${SITE_URL}/redeem" style="display: inline-block; background: linear-gradient(135deg, #22c55e, #16a34a); color: #ffffff; font-size: 18px; font-weight: 700; padding: 18px 48px; border-radius: 14px; text-decoration: none;">Redeem Now</a>
        </td>
      </tr>
    </table>
  `
}

// ============================================================
// PURCHASE CONFIRMATION EMAIL
// ============================================================

function buildPurchaseHTML(
  valueUsd: number,
  fee: number,
  totalPaid: number,
  code: string,
  status: "completed" | "failed",
  paymentMethod: string,
  design?: CardDesignConfig,
): string {
  const isSuccess = status === "completed"
  const statusColor = isSuccess ? "#22c55e" : "#ef4444"
  const cardDesign = design || getDefaultDesign()
  const cardImageUrl = getAbsoluteImageUrl(cardDesign.image)

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="width: 80px; height: 80px; background-color: ${statusColor}20; border-radius: 50%; text-align: center; line-height: 80px;">
                <span style="color: ${statusColor}; font-size: 40px;">${isSuccess ? "✓" : "✗"}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-bottom: 32px;">
          <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 8px 0;">${isSuccess ? "Purchase Successful!" : "Purchase Failed"}</h1>
          <p style="color: #888888; font-size: 16px; margin: 0;">${isSuccess ? "Your gift card is ready" : "Something went wrong"}</p>
        </td>
      </tr>
    </table>

    ${
      isSuccess
        ? `
    <!-- LARGE CARD IMAGE -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
      <tr>
        <td align="center">
          <img src="${cardImageUrl}" alt="${cardDesign.name}" width="480" style="display: block; width: 100%; max-width: 480px; height: auto; border-radius: 16px; border: 3px solid #333333;">
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-top: 16px;">
          <span style="color: #ffffff; font-size: 40px; font-weight: 700;">$${valueUsd}</span>
          <span style="color: #888888; font-size: 16px; display: block; margin-top: 4px;">${cardDesign.name}</span>
        </td>
      </tr>
    </table>
    `
        : ""
    }

    <!-- Order Details -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #1a1a1a; border-radius: 16px; margin-bottom: 32px;">
      <tr>
        <td style="padding: 24px;">
          <h3 style="color: #ffffff; font-size: 14px; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 1px;">Order Details</h3>
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="color: #888888; font-size: 15px; padding: 12px 0; border-bottom: 1px solid #333333;">Card Value</td>
              <td align="right" style="color: #ffffff; font-size: 15px; padding: 12px 0; border-bottom: 1px solid #333333;">$${valueUsd.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="color: #888888; font-size: 15px; padding: 12px 0; border-bottom: 1px solid #333333;">Service Fee</td>
              <td align="right" style="color: #ffffff; font-size: 15px; padding: 12px 0; border-bottom: 1px solid #333333;">$${fee.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="color: #888888; font-size: 15px; padding: 12px 0; border-bottom: 1px solid #333333;">Payment</td>
              <td align="right" style="color: #ffffff; font-size: 15px; padding: 12px 0; border-bottom: 1px solid #333333;">${paymentMethod}</td>
            </tr>
            <tr>
              <td style="color: #22c55e; font-size: 16px; font-weight: 600; padding: 16px 0 0 0;">Total Paid</td>
              <td align="right" style="color: #22c55e; font-size: 20px; font-weight: 700; padding: 16px 0 0 0;">$${totalPaid.toFixed(2)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${
      isSuccess
        ? `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
      <tr>
        <td align="center" style="background: linear-gradient(135deg, #22c55e15, #16a34a10); border: 2px solid #22c55e50; border-radius: 16px; padding: 24px;">
          <p style="color: #22c55e; font-size: 12px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Gift Card Code</p>
          <span style="color: #ffffff; font-size: 24px; font-family: monospace; letter-spacing: 3px; font-weight: 600;">${code}</span>
        </td>
      </tr>
    </table>
    `
        : ""
    }

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center">
          <a href="${SITE_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, ${statusColor}, ${statusColor}cc); color: #ffffff; font-size: 16px; font-weight: 600; padding: 16px 40px; border-radius: 12px; text-decoration: none;">View Dashboard</a>
        </td>
      </tr>
    </table>
  `
}

// ============================================================
// REDEMPTION EMAIL - WITH CARD IMAGE
// ============================================================

function buildRedemptionHTML(
  cardValue: number,
  cryptoAmount: number,
  crypto: string,
  network: string,
  walletAddress: string,
  status: string,
  shiftId?: string,
  design?: CardDesignConfig,
): string {
  const isFailed = status === "failed"
  const isProcessing = status === "processing"
  const statusColor = isFailed ? "#ef4444" : "#22c55e"
  const statusIcon = isFailed ? "✗" : isProcessing ? "⏳" : "✓"
  const statusText = isFailed ? "Redemption Failed" : isProcessing ? "Processing Redemption" : "Redemption Complete!"
  const cardDesign = design || getDefaultDesign()
  const cardImageUrl = getAbsoluteImageUrl(cardDesign.image)

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="width: 80px; height: 80px; background-color: ${statusColor}20; border-radius: 50%; text-align: center; line-height: 80px;">
                <span style="color: ${statusColor}; font-size: 40px;">${statusIcon}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-bottom: 32px;">
          <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 8px 0;">${statusText}</h1>
          <p style="color: #888888; font-size: 16px; margin: 0;">${isFailed ? "Your gift card is still valid - try again" : isProcessing ? "Your crypto is on its way" : "Crypto sent to your wallet"}</p>
        </td>
      </tr>
    </table>

    <!-- CARD IMAGE -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
      <tr>
        <td align="center">
          <img src="${cardImageUrl}" alt="${cardDesign.name}" width="400" style="display: block; width: 100%; max-width: 400px; height: auto; border-radius: 16px; border: 2px solid ${isFailed ? "#333333" : "#333333"}; ${isFailed ? "opacity: 0.6; filter: grayscale(50%);" : ""}">
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-top: 12px;">
          <span style="color: ${isFailed ? "#888888" : "#ffffff"}; font-size: 14px;">${isFailed ? "Attempted:" : "Redeemed:"} $${cardValue} - ${cardDesign.name}</span>
        </td>
      </tr>
    </table>

    ${
      !isFailed
        ? `
    <!-- Amount Received -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td align="center" style="background: linear-gradient(135deg, ${statusColor}15, ${statusColor}10); border: 2px solid ${statusColor}50; border-radius: 20px; padding: 32px;">
          <p style="color: ${statusColor}; font-size: 12px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">${isProcessing ? "Amount Processing" : "Amount Sent"}</p>
          <span style="color: #ffffff; font-size: 36px; font-weight: 700;">~${cryptoAmount.toFixed(6)}</span>
          <span style="color: #ffffff; font-size: 20px; font-weight: 500; margin-left: 8px;">${crypto.toUpperCase()}</span>
          <p style="color: #888888; font-size: 14px; margin: 16px 0 0 0;">Network: ${network}</p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #1a1a1a; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px;">
          <p style="color: #888888; font-size: 12px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">Sending To</p>
          <p style="color: #ffffff; font-size: 12px; font-family: monospace; margin: 0; word-break: break-all; background-color: #0a0a0a; padding: 12px; border-radius: 8px;">${walletAddress}</p>
        </td>
      </tr>
    </table>

    ${
      shiftId
        ? `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #1a1a1a; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px;">
          <p style="color: #888888; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Tracking ID</p>
          <p style="color: #22c55e; font-size: 13px; font-family: monospace; margin: 0;">${shiftId}</p>
        </td>
      </tr>
    </table>
    `
        : ""
    }

    <p style="color: #666666; font-size: 13px; text-align: center; margin: 0 0 24px 0;">Crypto transfers typically complete within 5-30 minutes.</p>
    `
        : `
    <!-- Failed Message -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td style="background-color: #ef444420; border: 2px solid #ef444450; border-radius: 16px; padding: 24px; text-align: center;">
          <p style="color: #ef4444; font-size: 16px; margin: 0 0 12px 0; font-weight: 600;">Don't worry - your gift card is still valid!</p>
          <p style="color: #888888; font-size: 14px; margin: 0;">Please try redeeming again or contact support if the issue persists.</p>
        </td>
      </tr>
    </table>
    `
    }

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center">
          <a href="${isFailed ? `${SITE_URL}/redeem` : `${SITE_URL}/dashboard`}" style="display: inline-block; background: linear-gradient(135deg, ${statusColor}, ${statusColor}cc); color: #ffffff; font-size: 16px; font-weight: 600; padding: 16px 40px; border-radius: 12px; text-decoration: none;">${isFailed ? "Try Again" : "View Dashboard"}</a>
        </td>
      </tr>
    </table>
  `
}

// ============================================================
// DEPOSIT EMAIL
// ============================================================

function buildDepositHTML(amount: number, crypto: string, newBalance: number): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="width: 80px; height: 80px; background-color: #22c55e20; border-radius: 50%; text-align: center; line-height: 80px;">
                <span style="color: #22c55e; font-size: 40px;">✓</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-bottom: 32px;">
          <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 8px 0;">Deposit Confirmed!</h1>
          <p style="color: #888888; font-size: 16px; margin: 0;">Your balance has been updated</p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td align="center" style="background: linear-gradient(135deg, #22c55e15, #16a34a10); border: 2px solid #22c55e50; border-radius: 20px; padding: 32px;">
          <p style="color: #22c55e; font-size: 12px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Amount Added</p>
          <span style="color: #ffffff; font-size: 48px; font-weight: 700;">+$${amount.toFixed(2)}</span>
          <p style="color: #888888; font-size: 14px; margin: 16px 0 0 0;">Paid with ${crypto.toUpperCase()}</p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #1a1a1a; border-radius: 16px; margin-bottom: 32px;">
      <tr>
        <td align="center" style="padding: 28px;">
          <p style="color: #888888; font-size: 14px; margin: 0 0 8px 0;">New Balance</p>
          <span style="color: #ffffff; font-size: 36px; font-weight: 700;">$${newBalance.toFixed(2)}</span>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center">
          <a href="${SITE_URL}/buy" style="display: inline-block; background: linear-gradient(135deg, #22c55e, #16a34a); color: #ffffff; font-size: 16px; font-weight: 600; padding: 16px 40px; border-radius: 12px; text-decoration: none;">Buy Gift Cards</a>
        </td>
      </tr>
    </table>
  `
}

// ============================================================
// ADMIN EMAIL TEMPLATE
// ============================================================

function buildAdminHTML(
  type: string,
  title: string,
  details: Record<string, string | number | undefined>,
  isError = false,
): string {
  const accentColor = isError ? "#ef4444" : "#22c55e"
  const rows = Object.entries(details)
    .filter(([, v]) => v !== undefined)
    .map(
      ([k, v]) => `
      <tr>
        <td style="color: #888888; font-size: 14px; padding: 12px; border-bottom: 1px solid #222222;">${k}</td>
        <td style="color: #ffffff; font-size: 14px; padding: 12px; border-bottom: 1px solid #222222; word-break: break-all;">${v}</td>
      </tr>
    `,
    )
    .join("")

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <span style="display: inline-block; background-color: ${accentColor}20; color: ${accentColor}; font-size: 12px; font-weight: 700; padding: 8px 20px; border-radius: 50px; text-transform: uppercase; letter-spacing: 1px;">${type}</span>
          <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 20px 0 0 0;">${title}</h1>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #1a1a1a; border-radius: 12px; margin-bottom: 24px; ${isError ? `border-left: 4px solid ${accentColor};` : ""}">
      <tr>
        <td style="padding: 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            ${rows}
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center">
          <a href="${SITE_URL}/admin" style="display: inline-block; background: linear-gradient(135deg, ${accentColor}, ${accentColor}cc); color: #ffffff; font-size: 14px; font-weight: 600; padding: 14px 32px; border-radius: 10px; text-decoration: none;">View Admin Dashboard</a>
        </td>
      </tr>
    </table>
  `
}

// ============================================================
// EMAIL SENDING FUNCTION
// ============================================================

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!resend) {
    console.log("[Email] Resend not configured, skipping email to:", to)
    return false
  }
  try {
    const { error } = await resend.emails.send({ from: FROM_EMAIL, to, subject, html })
    if (error) {
      console.error("[Email] Send failed:", error)
      return false
    }
    console.log("[Email] Sent to:", to)
    return true
  } catch (err) {
    console.error("[Email] Error:", err)
    return false
  }
}

// ============================================================
// EXPORTED EMAIL FUNCTIONS
// ============================================================

export async function sendGiftCardEmail(
  recipientEmail: string,
  options: {
    code: string
    valueUsd: number
    senderName?: string
    recipientName?: string
    message?: string
    design?: string
  },
): Promise<boolean> {
  const design = getDesignById(options.design || "") || getDefaultDesign()
  const content = buildGiftCardHTML(
    options.valueUsd,
    options.code,
    options.recipientName || "",
    options.senderName || "Someone",
    options.message || "",
    design,
  )
  const html = getBaseTemplate(content, `You received a $${options.valueUsd} Starix Gift Card!`)
  return sendEmail(
    recipientEmail,
    `🎁 ${options.senderName || "Someone"} sent you a $${options.valueUsd} Starix Gift Card!`,
    html,
  )
}

export async function sendPurchaseEmail(
  userEmail: string,
  options: {
    code: string
    valueUsd: number
    totalPaid: number
    fee: number
    paymentMethod: string
    depositCoin?: string
    status: "completed" | "failed"
    design?: string
  },
): Promise<boolean> {
  const design = options.design ? getDesignById(options.design) : undefined
  const content = buildPurchaseHTML(
    options.valueUsd,
    options.fee,
    options.totalPaid,
    options.code,
    options.status,
    options.depositCoin?.toUpperCase() || options.paymentMethod,
    design,
  )
  const html = getBaseTemplate(content, "Purchase Confirmation - Starix")
  return sendEmail(
    userEmail,
    `${options.status === "completed" ? "✓" : "✗"} Your $${options.valueUsd} Starix Gift Card`,
    html,
  )
}

export async function sendDepositEmail(
  userEmail: string,
  amount: number,
  crypto: string,
  newBalance: number,
): Promise<boolean> {
  const content = buildDepositHTML(amount, crypto, newBalance)
  const html = getBaseTemplate(content, "Deposit Confirmed - Starix")
  return sendEmail(userEmail, `💰 $${amount.toFixed(2)} deposited to your Starix balance`, html)
}

export async function sendRedemptionEmail(
  userEmail: string,
  cardValue: number,
  crypto: string,
  network: string,
  walletAddress: string,
  estimatedAmount: number,
  shiftId: string,
  status: string,
  design?: string,
): Promise<boolean> {
  if (!userEmail) return false
  const cardDesign = design ? getDesignById(design) : undefined
  const content = buildRedemptionHTML(
    cardValue,
    estimatedAmount,
    crypto,
    network,
    walletAddress,
    status,
    shiftId,
    cardDesign,
  )
  const html = getBaseTemplate(content, `Redemption ${status === "failed" ? "Failed" : "Processing"} - Starix`)
  const emoji = status === "failed" ? "✗" : status === "processing" ? "⏳" : "✓"
  return sendEmail(userEmail, `${emoji} Gift Card Redemption: $${cardValue} → ${crypto.toUpperCase()}`, html)
}

export async function sendRedemptionFailedEmail(
  userEmail: string,
  cardValue: number,
  crypto: string,
  network: string,
  errorReason: string,
  design?: string,
): Promise<boolean> {
  if (!userEmail) return false
  const cardDesign = design ? getDesignById(design) : undefined
  const content = buildRedemptionHTML(cardValue, 0, crypto, network, "", "failed", undefined, cardDesign)
  const html = getBaseTemplate(content, "Redemption Failed - Starix")
  return sendEmail(userEmail, `✗ Gift Card Redemption Failed - Please Try Again`, html)
}

// ============================================================
// ADMIN NOTIFICATION FUNCTIONS
// ============================================================

export async function notifyAdminPurchase(
  userEmail: string,
  options: {
    valueUsd: number
    totalPaid: number
    fee: number
    paymentMethod: string
    code: string
    design?: string
    recipientEmail?: string
    status?: string
  },
): Promise<boolean> {
  const content = buildAdminHTML(
    "New Purchase",
    `$${options.valueUsd} Gift Card ${options.status === "completed" ? "Sold" : "Purchased"}`,
    {
      Customer: userEmail,
      "Card Value": `$${options.valueUsd}`,
      "Service Fee": `$${options.fee}`,
      "Total Paid": `$${options.totalPaid}`,
      Payment: options.paymentMethod,
      "Card Code": options.code,
      Design: options.design || "Default",
      Recipient: options.recipientEmail || "Self",
      Status: options.status || "Completed",
    },
  )
  const html = getBaseTemplate(content, "New Purchase - Starix Admin")
  return sendEmail(ADMIN_EMAIL, `💰 New $${options.valueUsd} Gift Card Purchase`, html)
}

export async function notifyAdminDeposit(
  userEmail: string,
  amount: number,
  crypto: string,
  shiftId: string,
): Promise<boolean> {
  const content = buildAdminHTML("New Deposit", `$${amount.toFixed(2)} Deposit Confirmed`, {
    Customer: userEmail,
    Amount: `$${amount.toFixed(2)}`,
    Cryptocurrency: crypto.toUpperCase(),
    "Shift ID": shiftId,
  })
  const html = getBaseTemplate(content, "New Deposit - Starix Admin")
  return sendEmail(ADMIN_EMAIL, `💰 New $${amount.toFixed(2)} Deposit from ${userEmail}`, html)
}

export async function notifyAdminRedemption(
  userEmail: string,
  cardValue: number,
  crypto: string,
  network: string,
  walletAddress: string,
  estimatedAmount: number,
  shiftId: string,
  txHash: string,
): Promise<boolean> {
  const content = buildAdminHTML("Redemption Processing", `$${cardValue} Card Redeemed`, {
    Customer: userEmail,
    "Card Value": `$${cardValue}`,
    Receiving: `~${estimatedAmount.toFixed(6)} ${crypto.toUpperCase()}`,
    Network: network,
    Wallet: walletAddress,
    "Shift ID": shiftId,
    "Treasury TX": txHash || "Pending",
  })
  const html = getBaseTemplate(content, "Redemption Processing - Starix Admin")
  return sendEmail(ADMIN_EMAIL, `🔄 $${cardValue} Gift Card Redeemed → ${crypto.toUpperCase()}`, html)
}

export async function notifyAdminRedemptionFailed(
  userEmail: string,
  cardValue: number,
  crypto: string,
  reason: string,
  treasuryBalance: number,
  requiredAmount: number,
  treasuryAsset: string,
): Promise<boolean> {
  const content = buildAdminHTML(
    "URGENT: Redemption Failed",
    `$${cardValue} Redemption Could Not Process`,
    {
      Customer: userEmail,
      "Card Value": `$${cardValue}`,
      Requested: crypto.toUpperCase(),
      Error: reason,
      "Treasury Balance": `${treasuryBalance.toFixed(6)} ${treasuryAsset.toUpperCase()}`,
      "Required Amount": `${requiredAmount.toFixed(6)} ${treasuryAsset.toUpperCase()}`,
      Shortfall: `${(requiredAmount - treasuryBalance).toFixed(6)} ${treasuryAsset.toUpperCase()}`,
    },
    true,
  )
  const html = getBaseTemplate(content, "URGENT: Redemption Failed - Starix Admin")
  return sendEmail(ADMIN_EMAIL, `🚨 URGENT: Redemption Failed - Treasury Low ($${cardValue} card)`, html)
}

export async function notifyAdminError(
  route: string,
  error: string,
  context?: Record<string, unknown>,
): Promise<boolean> {
  const content = buildAdminHTML(
    "System Error",
    `Error in ${route}`,
    {
      Route: route,
      Error: error,
      Time: new Date().toISOString(),
      ...(context ? { Context: JSON.stringify(context, null, 2) } : {}),
    },
    true,
  )
  const html = getBaseTemplate(content, "System Error - Starix Admin")
  return sendEmail(ADMIN_EMAIL, `🚨 System Error: ${route}`, html)
}

export async function notifyAdminDepositFailed(
  userEmail: string,
  amount: number,
  crypto: string,
  error: string,
): Promise<boolean> {
  const content = buildAdminHTML(
    "Deposit Failed",
    `$${amount.toFixed(2)} Deposit Error`,
    {
      Customer: userEmail,
      Amount: `$${amount.toFixed(2)}`,
      Cryptocurrency: crypto.toUpperCase(),
      Error: error,
    },
    true,
  )
  const html = getBaseTemplate(content, "Deposit Failed - Starix Admin")
  return sendEmail(ADMIN_EMAIL, `🚨 Deposit Failed: $${amount.toFixed(2)} from ${userEmail}`, html)
}

export async function notifyAdminPurchaseFailed(userEmail: string, valueUsd: number, error: string): Promise<boolean> {
  const content = buildAdminHTML(
    "Purchase Failed",
    `$${valueUsd} Purchase Error`,
    {
      Customer: userEmail,
      "Card Value": `$${valueUsd}`,
      Error: error,
    },
    true,
  )
  const html = getBaseTemplate(content, "Purchase Failed - Starix Admin")
  return sendEmail(ADMIN_EMAIL, `🚨 Purchase Failed: $${valueUsd} card from ${userEmail}`, html)
}
