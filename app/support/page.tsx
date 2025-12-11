import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  HelpCircle,
  Mail,
  MessageSquare,
  Shield,
  Clock,
  CreditCard,
  Gift,
  Lock,
  RefreshCw,
  Wallet,
  Info,
} from "lucide-react"

const faqs = [
  {
    category: "Getting Started",
    icon: Gift,
    questions: [
      {
        q: "How do I buy a gift card?",
        a: "Navigate to the Buy Gift Card page, select your desired amount ($5-$100,000), choose a design, and pay with any of 200+ supported cryptocurrencies. Once payment confirms, your gift card code will be generated instantly.",
      },
      {
        q: "What cryptocurrencies can I use to pay?",
        a: "We support 200+ cryptocurrencies through SideShift, including Bitcoin, Ethereum, USDT, USDC, BNB, SOL, TRX, XRP, LTC, DOGE, and many more. You can pay with any supported coin and we'll handle the conversion automatically.",
      },
      {
        q: "What are the minimum and maximum gift card values?",
        a: "Gift cards can be purchased for any amount between $5 and $100,000 USD. The exact minimum may vary based on admin settings.",
      },
    ],
  },
  {
    category: "Fees & Pricing",
    icon: CreditCard,
    questions: [
      {
        q: "What fees does Starix charge?",
        a: "Starix charges a small service fee (default 2.5%) on gift card purchases. This fee helps us maintain the platform, cover operational costs, and provide customer support. Redemption is completely FREE - we don't charge anything when you redeem your gift card.",
      },
      {
        q: "Are there any other fees I should know about?",
        a: "Yes, when paying with cryptocurrency or redeeming to crypto, there are additional fees from our exchange partner (SideShift) and blockchain network fees. SideShift charges a small conversion fee for swapping between cryptocurrencies. Network fees vary depending on which blockchain you use - for example, Bitcoin and Ethereum typically have higher fees than networks like Tron or Solana.",
      },
      {
        q: "Why might I receive slightly less than the card value when redeeming?",
        a: "When you redeem a gift card, the USD value is converted to your chosen cryptocurrency through SideShift. This conversion involves: 1) Exchange rate fluctuations, 2) SideShift's conversion fee, and 3) Blockchain network fees to send the crypto to your wallet. Starix does NOT charge any redemption fee - the difference is entirely from the crypto conversion process.",
      },
      {
        q: "How can I minimize fees when redeeming?",
        a: "To minimize fees when redeeming: 1) Choose stablecoins like USDT or USDC on low-fee networks (Tron TRC20 or Solana), 2) Avoid congested networks like Ethereum mainnet during peak times, 3) Redeem larger amounts at once rather than multiple small redemptions.",
      },
      {
        q: "Are there any hidden fees?",
        a: "No hidden fees from Starix. The service fee shown at checkout is what we charge. However, be aware of external fees: your crypto wallet may charge withdrawal fees, and blockchain networks charge transaction fees. We always show you an estimate of what you'll receive before you confirm.",
      },
    ],
  },
  {
    category: "Redemption",
    icon: Wallet,
    questions: [
      {
        q: "How do I redeem a gift card?",
        a: "Go to the Redeem page, enter your gift card code, and if it has a password, enter that too. Then choose which cryptocurrency you want to receive and provide your wallet address. The funds will be sent directly to your wallet.",
      },
      {
        q: "What cryptocurrencies can I redeem to?",
        a: "You can redeem to any cryptocurrency supported by SideShift, including BTC, ETH, USDT, USDC, XRP, SOL, TRX, and 200+ more. Choose the coin and network that best suits your needs.",
      },
      {
        q: "How long does redemption take?",
        a: "Redemption typically takes 5-30 minutes depending on blockchain network congestion. You'll receive a transaction hash to track your payment. Some networks like Tron and Solana are usually faster than Bitcoin or Ethereum.",
      },
      {
        q: "Will I receive the exact gift card value?",
        a: "The full USD value of your gift card is sent for conversion with zero platform fee from Starix. However, the final crypto amount you receive may be slightly less due to SideShift's exchange rate and conversion fees, plus blockchain network fees. This is standard for any crypto conversion.",
      },
    ],
  },
  {
    category: "Security",
    icon: Shield,
    questions: [
      {
        q: "Is my gift card secure?",
        a: "Yes. Gift cards use randomly generated codes (format: STARIX-XXXX-XXXX-XXXX) that are impossible to guess. You can also add password protection for extra security. We recommend sharing codes only with intended recipients.",
      },
      {
        q: "What is password protection?",
        a: "When creating a gift card, you can set an optional password. The recipient will need both the card code AND the password to redeem it. This adds an extra layer of security, especially for high-value cards.",
      },
      {
        q: "Can I send gift cards anonymously?",
        a: "Yes! When purchasing, you can toggle 'Send Anonymously' and your name won't be shown to the recipient. The card will simply show 'Someone special' as the sender.",
      },
    ],
  },
  {
    category: "Expiration & Issues",
    icon: Clock,
    questions: [
      {
        q: "Do gift cards expire?",
        a: "Yes, gift cards expire 90 days after purchase by default. You can see the exact expiration date when checking your card. Expired cards cannot be redeemed, so make sure to use them before the expiration date.",
      },
      {
        q: "What happens if my payment doesn't go through?",
        a: "If your payment fails or is underpaid, the gift card won't be activated. If you underpaid, the amount may be credited to your account balance. Contact support with your transaction details for assistance.",
      },
      {
        q: "I lost my gift card code. Can you help?",
        a: "If you have an account and purchased while logged in, you can find all your gift cards in your Dashboard under 'My Cards'. Otherwise, contact support with your purchase details (transaction ID, email, amount) and we'll help locate your card.",
      },
    ],
  },
]

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2 sm:mb-4">Help & Support</h1>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Find answers to common questions or get in touch with our support team
          </p>
        </div>

        <Card className="bg-emerald-500/10 border-emerald-500/30 mb-8">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Understanding Our Fees</h3>
                <p className="text-sm text-muted-foreground">
                  Starix charges a small service fee on purchases only.{" "}
                  <span className="text-emerald-500 font-medium">Redemption is FREE.</span> When redeeming, the crypto
                  amount you receive may vary slightly due to exchange rates and blockchain network fees charged by
                  SideShift and the crypto network - not by Starix.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <div className="space-y-6 sm:space-y-8 mb-12 sm:mb-16">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Frequently Asked Questions</h2>

          {faqs.map((category) => (
            <Card key={category.category} className="bg-card border-border">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-xl">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <category.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  {category.category}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((faq, index) => (
                    <AccordionItem key={index} value={`${category.category}-${index}`} className="border-border">
                      <AccordionTrigger className="text-left text-foreground hover:text-primary text-sm sm:text-base py-3 sm:py-4">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Section */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          <Card className="bg-card border-border">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Contact Support
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Send us a message and we'll get back to you within 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
              <div className="space-y-2">
                <Label className="text-sm">Email</Label>
                <Input type="email" placeholder="your@email.com" className="bg-background text-sm h-10 sm:h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Subject</Label>
                <Input placeholder="How can we help?" className="bg-background text-sm h-10 sm:h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Message</Label>
                <Textarea
                  placeholder="Describe your issue or question..."
                  className="bg-background min-h-[100px] sm:min-h-[120px] text-sm"
                />
              </div>
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 sm:h-11 text-sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4 sm:space-y-6">
            <Card className="bg-card border-border">
              <CardContent className="p-4 sm:pt-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1 text-sm sm:text-base">Transaction Issues</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      For payment or redemption issues, include your transaction ID or shift ID in your message.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4 sm:pt-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1 text-sm sm:text-base">Security Concerns</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Never share your gift card codes publicly. If you suspect unauthorized access, contact us
                      immediately.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4 sm:pt-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1 text-sm sm:text-base">Response Time</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      We typically respond within 24 hours. Urgent issues are prioritized.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
