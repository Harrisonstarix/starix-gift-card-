"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Gift,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Copy,
  Check,
  Plus,
  CreditCard,
  TrendingUp,
  Search,
  ExternalLink,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
} from "lucide-react"
import { GiftCard3D } from "@/components/gift-card-3d"
import { NotificationsPanel } from "@/components/notifications-panel"
import type { User } from "@supabase/supabase-js"

interface PurchasedCard {
  id: string
  code: string
  value_usd: number
  design: string
  status: "pending" | "active" | "redeemed" | "expired" | "cancelled"
  recipient_name?: string
  recipient_email?: string
  message?: string
  created_at: string
  expires_at: string
  payment_crypto?: string
  payment_amount?: number
  payment_tx_hash?: string
  platform_fee_usd?: number
  total_paid_usd?: number
}

interface Transaction {
  id: string
  type: "purchase" | "redemption" | "deposit"
  gift_card_id?: string
  gift_card_code?: string
  gift_card_value?: number
  deposit_coin?: string
  deposit_network?: string
  deposit_amount?: number
  settle_coin?: string
  settle_network?: string
  settle_amount?: number
  status: string
  tx_hash?: string
  sideshift_id?: string
  created_at: string
}

interface UserStats {
  totalPurchased: number
  totalValue: number
  activeCards: number
  redeemedCards: number
}

export default function UserDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<PurchasedCard[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<UserStats>({
    totalPurchased: 0,
    totalValue: 0,
    activeCards: 0,
    redeemedCards: 0,
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [copied, setCopied] = useState<string | null>(null)
  const [selectedCard, setSelectedCard] = useState<PurchasedCard | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login?redirect=/dashboard")
        return
      }

      setUser(user)
      fetchUserData()
    }

    checkAuth()
  }, [router])

  const fetchUserData = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/user/gift-cards")
      if (res.ok) {
        const data = await res.json()
        setCards(data.giftCards || [])
        setStats(data.stats || stats)
        setTransactions(data.transactions || [])
      }
    } catch (err) {
      console.error("Failed to fetch user data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const filteredCards = cards.filter(
    (card) =>
      card.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.recipient_email?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
      case "settled":
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "redeemed":
        return <Gift className="w-4 h-4 text-blue-500" />
      case "pending":
      case "payment_pending":
      case "waiting":
      case "processing":
      case "activating":
        return <Clock className="w-4 h-4 text-yellow-500" />
      case "expired":
      case "cancelled":
      case "failed":
      case "payment_failed":
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "settled":
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "redeemed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "pending":
      case "payment_pending":
      case "waiting":
      case "processing":
      case "activating":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "expired":
      case "cancelled":
      case "failed":
      case "payment_failed":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header with Notifications */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Manage your gift cards and view transactions
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <NotificationsPanel />
            <Button
              onClick={fetchUserData}
              variant="outline"
              size="icon"
              className="bg-transparent h-9 w-9 sm:h-10 sm:w-10"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Link href="/buy">
              <Button className="bg-emerald-600 text-white hover:bg-emerald-700 h-9 sm:h-10 text-sm shadow-lg shadow-emerald-600/25">
                <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Buy New Card</span>
                <span className="xs:hidden">Buy</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats - Improved responsive grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="bg-card border-border">
            <CardContent className="p-3 sm:pt-6 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold text-foreground">{stats.totalPurchased}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Total Purchased</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-3 sm:pt-6 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold text-foreground">${stats.totalValue}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Total Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-3 sm:pt-6 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold text-foreground">{stats.activeCards}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-3 sm:pt-6 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold text-foreground">{stats.redeemedCards}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Redeemed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search - Made search responsive */}
        <div className="mb-4 sm:mb-6">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by code, recipient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background text-sm h-10"
            />
          </div>
        </div>

        <Tabs defaultValue="cards" className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="bg-muted border border-border inline-flex min-w-max">
              <TabsTrigger value="cards" className="data-[state=active]:bg-background text-xs sm:text-sm">
                <Gift className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">My Cards</span>
                <span className="sm:hidden">Cards</span>
                <span className="ml-1">({cards.length})</span>
              </TabsTrigger>
              <TabsTrigger value="transactions" className="data-[state=active]:bg-background text-xs sm:text-sm">
                <Receipt className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Transactions</span>
                <span className="sm:hidden">Txns</span>
                <span className="ml-1">({transactions.length})</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Cards Tab */}
          <TabsContent value="cards">
            <Tabs defaultValue="all" className="space-y-4">
              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                <TabsList className="bg-muted/50 border border-border inline-flex min-w-max">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-background text-xs sm:text-sm px-2 sm:px-3"
                  >
                    All ({cards.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="active"
                    className="data-[state=active]:bg-background text-xs sm:text-sm px-2 sm:px-3"
                  >
                    Active ({cards.filter((c) => c.status === "active").length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="pending"
                    className="data-[state=active]:bg-background text-xs sm:text-sm px-2 sm:px-3"
                  >
                    Pending ({cards.filter((c) => c.status === "pending").length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="redeemed"
                    className="data-[state=active]:bg-background text-xs sm:text-sm px-2 sm:px-3"
                  >
                    Redeemed ({cards.filter((c) => c.status === "redeemed").length})
                  </TabsTrigger>
                </TabsList>
              </div>

              {["all", "active", "pending", "redeemed"].map((tab) => (
                <TabsContent key={tab} value={tab}>
                  <div className="grid gap-3 sm:gap-4">
                    {filteredCards
                      .filter((card) => tab === "all" || card.status === tab)
                      .map((card) => (
                        <Card
                          key={card.id}
                          className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer"
                          onClick={() => setSelectedCard(card)}
                        >
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center gap-3 sm:gap-6">
                              <div className="hidden md:block scale-50 origin-left -my-12 -mr-20">
                                <GiftCard3D variant={card.design} value={card.value_usd} />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                                  <span className="font-mono text-sm sm:text-lg text-foreground truncate">
                                    {card.code}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleCopy(card.code, card.id)
                                    }}
                                    className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                                  >
                                    {copied === card.id ? (
                                      <Check className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </button>
                                  <Badge className={`${getStatusColor(card.status)} text-xs`}>
                                    {getStatusIcon(card.status)}
                                    <span className="ml-1">{card.status}</span>
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-xs sm:text-sm text-muted-foreground">
                                  <span className="text-xl sm:text-2xl font-bold text-foreground">
                                    ${card.value_usd}
                                  </span>
                                  {card.recipient_name && (
                                    <span className="truncate max-w-[100px] sm:max-w-none">
                                      To: {card.recipient_name}
                                    </span>
                                  )}
                                  <span className="hidden sm:inline">
                                    Created: {new Date(card.created_at).toLocaleDateString()}
                                  </span>
                                  <span className="sm:hidden">{new Date(card.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>

                              <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                    {filteredCards.filter((card) => tab === "all" || card.status === tab).length === 0 && (
                      <div className="text-center py-8 sm:py-12">
                        <Gift className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground text-sm sm:text-base">No gift cards found</p>
                        <Link href="/buy">
                          <Button className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90 text-sm">
                            Buy Your First Gift Card
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card className="bg-card border-border">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Transaction History</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  All your deposits, purchases, and redemptions
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <Tabs defaultValue="all" className="space-y-4">
                  <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                    <TabsList className="bg-muted/50 border border-border inline-flex min-w-max">
                      <TabsTrigger
                        value="all"
                        className="data-[state=active]:bg-background text-xs sm:text-sm px-2 sm:px-3"
                      >
                        All
                      </TabsTrigger>
                      <TabsTrigger
                        value="pending"
                        className="data-[state=active]:bg-background text-xs sm:text-sm px-2 sm:px-3"
                      >
                        Pending
                      </TabsTrigger>
                      <TabsTrigger
                        value="completed"
                        className="data-[state=active]:bg-background text-xs sm:text-sm px-2 sm:px-3"
                      >
                        Completed
                      </TabsTrigger>
                      <TabsTrigger
                        value="failed"
                        className="data-[state=active]:bg-background text-xs sm:text-sm px-2 sm:px-3"
                      >
                        Failed
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {["all", "pending", "completed", "failed"].map((statusFilter) => (
                    <TabsContent key={statusFilter} value={statusFilter}>
                      <div className="space-y-3 sm:space-y-4">
                        {transactions
                          .filter((tx) => {
                            if (statusFilter === "all") return true
                            if (statusFilter === "pending")
                              return ["pending", "payment_pending", "waiting", "processing", "activating"].includes(
                                tx.status,
                              )
                            if (statusFilter === "completed") return ["settled", "completed"].includes(tx.status)
                            if (statusFilter === "failed")
                              return ["failed", "cancelled", "expired", "payment_failed"].includes(tx.status)
                            return true
                          })
                          .map((tx) => (
                            <div
                              key={tx.id}
                              className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-muted/50 border border-border"
                            >
                              <div
                                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  tx.type === "purchase"
                                    ? "bg-primary/20"
                                    : tx.type === "deposit"
                                      ? "bg-green-500/20"
                                      : "bg-blue-500/20"
                                }`}
                              >
                                {tx.type === "purchase" ? (
                                  <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                                ) : tx.type === "deposit" ? (
                                  <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                                ) : (
                                  <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="font-medium text-foreground capitalize text-sm">{tx.type}</span>
                                  <Badge className={`${getStatusColor(tx.status)} text-xs`}>
                                    {getStatusIcon(tx.status)}
                                    <span className="ml-1">{tx.status}</span>
                                  </Badge>
                                </div>
                                <div className="text-xs sm:text-sm text-muted-foreground truncate">
                                  {tx.gift_card_code && <span className="font-mono">{tx.gift_card_code}</span>}
                                  {tx.gift_card_value && <span> - ${tx.gift_card_value}</span>}
                                  {tx.deposit_coin && !tx.gift_card_code && (
                                    <span>
                                      {tx.deposit_amount} {tx.deposit_coin.toUpperCase()}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="text-right flex-shrink-0">
                                {tx.type === "purchase" && tx.deposit_amount && (
                                  <p className="font-medium text-foreground text-xs sm:text-sm">
                                    {tx.deposit_amount} {tx.deposit_coin?.toUpperCase()}
                                  </p>
                                )}
                                {tx.type === "deposit" && tx.settle_amount && (
                                  <p className="font-medium text-green-500 text-xs sm:text-sm">
                                    +${tx.settle_amount.toFixed(2)}
                                  </p>
                                )}
                                {tx.type === "redemption" && tx.settle_amount && (
                                  <p className="font-medium text-foreground text-xs sm:text-sm">
                                    {tx.settle_amount} {tx.settle_coin?.toUpperCase()}
                                  </p>
                                )}
                                <p className="text-[10px] sm:text-xs text-muted-foreground">
                                  {new Date(tx.created_at).toLocaleDateString()}
                                </p>
                              </div>

                              {tx.sideshift_id && (
                                <a
                                  href={`https://sideshift.ai/orders/${tx.sideshift_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex-shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          ))}

                        {transactions.filter((tx) => {
                          if (statusFilter === "all") return true
                          if (statusFilter === "pending")
                            return ["pending", "payment_pending", "waiting", "processing", "activating"].includes(
                              tx.status,
                            )
                          if (statusFilter === "completed") return ["settled", "completed"].includes(tx.status)
                          if (statusFilter === "failed")
                            return ["failed", "cancelled", "expired", "payment_failed"].includes(tx.status)
                          return true
                        }).length === 0 && (
                          <div className="text-center py-8 sm:py-12">
                            <Receipt className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground text-sm">No transactions found</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Card Detail Modal - Made modal responsive */}
        {selectedCard && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
            onClick={() => setSelectedCard(null)}
          >
            <Card
              className="bg-card border-border max-w-2xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-start sm:items-center justify-between gap-2 flex-wrap">
                  <div className="min-w-0">
                    <CardTitle className="text-lg sm:text-xl">Gift Card Details</CardTitle>
                    <CardDescription className="font-mono text-xs sm:text-sm truncate">
                      {selectedCard.code}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(selectedCard.status)}>
                    {getStatusIcon(selectedCard.status)}
                    <span className="ml-1">{selectedCard.status}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0 sm:pt-0">
                <div className="flex justify-center gift-card-scale">
                  <GiftCard3D
                    variant={selectedCard.design}
                    value={selectedCard.value_usd}
                    recipientName={selectedCard.recipient_name}
                    code={selectedCard.code}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs sm:text-sm">Card Value</p>
                    <p className="text-lg sm:text-xl font-bold text-foreground">${selectedCard.value_usd}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs sm:text-sm">Status</p>
                    <p className="text-foreground capitalize text-sm sm:text-base">{selectedCard.status}</p>
                  </div>
                  {selectedCard.recipient_name && (
                    <div>
                      <p className="text-muted-foreground text-xs sm:text-sm">Recipient</p>
                      <p className="text-foreground text-sm sm:text-base truncate">{selectedCard.recipient_name}</p>
                    </div>
                  )}
                  {selectedCard.recipient_email && (
                    <div>
                      <p className="text-muted-foreground text-xs sm:text-sm">Email</p>
                      <p className="text-foreground text-sm sm:text-base truncate">{selectedCard.recipient_email}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground text-xs sm:text-sm">Created</p>
                    <p className="text-foreground text-sm sm:text-base">
                      {new Date(selectedCard.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs sm:text-sm">Expires</p>
                    <p className="text-foreground text-sm sm:text-base">
                      {new Date(selectedCard.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedCard.payment_crypto && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs sm:text-sm">Payment</p>
                      <p className="text-foreground text-sm sm:text-base">
                        {selectedCard.payment_amount} {selectedCard.payment_crypto}
                      </p>
                    </div>
                  )}
                </div>

                {selectedCard.message && (
                  <div className="p-3 sm:p-4 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground text-xs sm:text-sm mb-1">Message</p>
                    <p className="text-foreground text-sm">{selectedCard.message}</p>
                  </div>
                )}

                <div className="flex gap-3 flex-col sm:flex-row">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      handleCopy(selectedCard.code, "modal")
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Code
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedCard(null)} className="flex-1 sm:flex-none">
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
