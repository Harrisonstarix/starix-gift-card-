"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  RefreshCw,
  Check,
  Loader2,
  Gift,
  Clock,
  TrendingUp,
  AlertTriangle,
  Settings,
  Trash2,
  DollarSign,
  Percent,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  XCircle,
  Copy,
  PiggyBank,
  Eye,
  ChevronRight,
  Activity,
  Users,
  BarChart3,
  Calendar,
  FileText,
} from "lucide-react"
import { getCoinIconUrl } from "@/lib/sideshift"
import { CARD_CATEGORIES, getDesignsByCategory, getCategoryLabel } from "@/lib/card-designs"
import { cn } from "@/lib/utils"
import { AdminChartsDashboard } from "@/components/admin-charts"
import type { User } from "@supabase/supabase-js"

const ADMIN_EMAIL = "ighanghangodspower@gmail.com"

interface AdminUser {
  id: string
  email: string
  fullName: string | null
  isAdmin: boolean
  createdAt: string
  balance: number
  totalDeposited: number
  totalSpent: number
  depositStats: {
    total: number
    completed: number
    pending: number
    totalAmount: number
  }
  cardStats: {
    total: number
    active: number
    redeemed: number
    totalValue: number
  }
}

interface UserDetail {
  user: {
    id: string
    email: string
    fullName: string | null
    isAdmin: boolean
    createdAt: string
  }
  balance: {
    current: number
    totalDeposited: number
    totalSpent: number
  }
  depositStats: any
  cardStats: any
  deposits: any[]
  giftCards: any[]
  balanceTransactions: any[]
  notifications: any[]
}

interface ChartDataItem {
  label: string
  timestamp: string
  deposits: number
  depositVolume: number
  purchases: number
  purchaseVolume: number
  redemptions: number
  redemptionVolume: number
  fees: number
  users: number
}

interface Deposit {
  id: string
  user_id: string
  amount_usd: number
  settled_amount: number | null
  deposit_coin: string
  deposit_network: string
  deposit_address: string
  shift_id: string
  status: string
  created_at: string
  completed_at: string | null
  profiles?: {
    email: string
    full_name: string | null
  }
}

interface DepositStats {
  total: number
  pending: number
  completed: number
  failed: number
  totalRequested: number
  totalReceived: number
  last24h: number
  last7d: number
  last30d: number
  volume24h: number
  volume7d: number
  volume30d: number
}

interface CoinOption {
  id: string
  name: string
  symbol: string
  network: string
  networkName?: string
  networks?: string[]
  icon?: string
  hasMemo?: boolean
}

interface GiftCard {
  id: string
  code: string
  value_usd: number
  status: string
  recipient_name?: string
  recipient_email?: string
  buyer_email?: string
  sender_name?: string
  message?: string
  design_variant?: string
  payment_crypto?: string
  payment_network?: string
  payment_tx_hash?: string
  platform_fee?: number
  total_paid?: number
  created_at: string
  expires_at?: string
  redeemed_at?: string
  creator?: {
    email: string
    full_name: string | null
  } | null
}

interface Redemption {
  id: string
  gift_card_id: string
  gift_card_code: string
  value_usd: number
  settle_coin: string
  settle_network: string
  settle_address: string
  deposit_amount?: number
  actual_amount?: number
  estimated_amount?: number
  shift_id?: string
  status: string
  treasury_tx_hash?: string
  settle_tx_hash?: string
  error_message?: string
  created_at: string
  completed_at?: string
  gift_card?: {
    code: string
    buyer_email: string | null
    created_by: string | null
    value_usd: number
  } | null
}

interface Transaction {
  id: string
  type: string
  user_id?: string
  sideshift_id: string
  deposit_coin: string
  deposit_network?: string
  deposit_amount?: number
  settle_coin: string
  settle_network?: string
  settle_amount?: number
  status: string
  tx_hash?: string
  gift_card_code?: string
  gift_card_value?: number
  created_at: string
  updated_at?: string
  user?: {
    email: string
    full_name: string | null
  } | null
}

interface TreasuryWallet {
  id: string
  asset: string
  network: string
  address: string
  is_primary: boolean
  created_at: string
}

interface AdminSettings {
  hasTreasuryWallet: boolean
  treasuryAsset: string | null
  treasuryNetwork: string | null
  treasuryAddress: string | null
  feePercentage: number
  feeMinimum: number
  giftCardExpiryDays: number
  minGiftCardValue: number
  maxGiftCardValue: number
  minDepositValue: number
  maxDepositValue: number
  autoProcessRedemptions: boolean
}

interface TransactionStats {
  totalPurchases: number
  totalRedemptions: number
  totalDeposits: number
  pendingTransactions: number
  failedTransactions: number
  purchaseVolume: number
  redemptionVolume: number
}

interface GeneratedCard {
  id: string
  code: string
  value: number
  design: string
  expiresAt: string
}

// Helper function for badge colors
const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-500/20 text-green-400 border-green-500/30"
    case "pending":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    case "processing":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    case "failed":
      return "bg-red-500/20 text-red-400 border-red-500/30"
    case "active":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    case "redeemed":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30"
    case "expired":
      return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    case "waiting":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30"
    case "settled":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    case "cancelled": // Added cancelled status color
      return "bg-red-500/20 text-red-400 border-red-500/30"
    default:
      return "bg-muted/10 text-muted-foreground border-muted/30"
  }
}

export default function AdminDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [deletingWallet, setDeletingWallet] = useState(false)

  const [coins, setCoins] = useState<CoinOption[]>([])
  const [loadingCoins, setLoadingCoins] = useState(true)

  // Treasury wallet state
  const [treasuryWallet, setTreasuryWallet] = useState<TreasuryWallet | null>(null)
  const [selectedCoin, setSelectedCoin] = useState("")
  const [selectedNetwork, setSelectedNetwork] = useState("")
  const [walletAddress, setWalletAddress] = useState("")

  // Fee settings state
  const [feePercentage, setFeePercentage] = useState(2.5)
  const [feeMinimum, setFeeMinimum] = useState(0.5)
  const [giftCardExpiryDays, setGiftCardExpiryDays] = useState(90)
  const [minGiftCardValue, setMinGiftCardValue] = useState(5)
  const [maxGiftCardValue, setMaxGiftCardValue] = useState(100000)
  const [minDepositValue, setMinDepositValue] = useState(5)
  const [maxDepositValue, setMaxDepositValue] = useState(100000)
  const [autoProcessRedemptions, setAutoProcessRedemptions] = useState(false)

  const [giftCards, setGiftCards] = useState<GiftCard[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [depositStats, setDepositStats] = useState<DepositStats>({
    total: 0,
    pending: 0,
    completed: 0,
    failed: 0,
    totalRequested: 0,
    totalReceived: 0,
    last24h: 0,
    last7d: 0,
    last30d: 0,
    volume24h: 0,
    volume7d: 0,
    volume30d: 0,
  })
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null)

  const [users, setUsers] = useState<AdminUser[]>([])
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    usersWithBalance: 0,
    totalBalanceHeld: 0,
    totalDeposited: 0,
    totalSpent: 0,
    newUsersLast7d: 0,
  })
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [loadingUserDetail, setLoadingUserDetail] = useState(false)

  // Chart data state
  const [chartData, setChartData] = useState<ChartDataItem[]>([])
  const [chartTotals, setChartTotals] = useState({
    deposits: 0,
    depositVolume: 0,
    purchases: 0,
    purchaseVolume: 0,
    redemptions: 0,
    redemptionVolume: 0,
    fees: 0,
    users: 0,
  })
  const [chartStatusBreakdown, setChartStatusBreakdown] = useState({
    deposits: { pending: 0, completed: 0, failed: 0 },
    giftCards: { pending: 0, active: 0, redeemed: 0, expired: 0 },
    redemptions: { pending: 0, processing: 0, completed: 0, failed: 0 },
  })
  const [chartPeriod, setChartPeriod] = useState("30d")
  const [loadingChart, setLoadingChart] = useState(false)

  const [activeTab, setActiveTab] = useState("overview")
  const [processingRedemption, setProcessingRedemption] = useState<string | null>(null)

  const [txStatusFilter, setTxStatusFilter] = useState("all")
  const [txTypeFilter, setTxTypeFilter] = useState("all")
  const [depositStatusFilter, setDepositStatusFilter] = useState("all")
  const [userSearchQuery, setUserSearchQuery] = useState("")

  const [txStats, setTxStats] = useState<TransactionStats>({
    totalPurchases: 0,
    totalRedemptions: 0,
    totalDeposits: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
    purchaseVolume: 0,
    redemptionVolume: 0,
  })

  const [stats, setStats] = useState({
    totalCards: 0,
    totalValue: 0,
    activeCards: 0,
    pendingCards: 0,
    redeemedCards: 0,
    pendingRedemptions: 0,
    processingRedemptions: 0,
    completedRedemptions: 0,
    totalRedeemed: 0,
    totalFees: 0,
  })

  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [generatingCards, setGeneratingCards] = useState(false)
  const [genDesign, setGenDesign] = useState("obsidian")
  const [genCategory, setGenCategory] = useState("premium")
  const [genAmount, setGenAmount] = useState(100)
  const [genQuantity, setGenQuantity] = useState(1)
  const [genRecipientName, setGenRecipientName] = useState("")
  const [genMessage, setGenMessage] = useState("")
  const [genPassword, setGenPassword] = useState("")
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([])

  const [selectedGiftCard, setSelectedGiftCard] = useState<GiftCard | null>(null)
  const [changingStatus, setChangingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState<string | null>(null)

  const [bulkCodes, setBulkCodes] = useState("")
  const [bulkStatus, setBulkStatus] = useState<string>("")
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [bulkResults, setBulkResults] = useState<{
    success: boolean
    message: string
    summary?: { total: number; successful: number; failed: number; notFound: number }
    results?: Array<{ code: string; success: boolean; oldStatus?: string; newStatus?: string; error?: string }>
  } | null>(null)

  const [selectedRedemption, setSelectedRedemption] = useState<Redemption | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  const isAdmin = user?.email === ADMIN_EMAIL || user?.user_metadata?.is_admin === true

  const availableNetworks = useMemo(() => {
    if (!selectedCoin) return []
    const coin = coins.find((c) => c.symbol.toLowerCase() === selectedCoin.toLowerCase())
    return coin?.networks || [coin?.network].filter(Boolean)
  }, [selectedCoin, coins])

  const categoryDesigns = useMemo(() => {
    return getDesignsByCategory(genCategory)
  }, [genCategory])

  const filteredDeposits = useMemo(() => {
    return deposits.filter((d) => {
      if (depositStatusFilter !== "all" && d.status !== depositStatusFilter) return false
      return true
    })
  }, [deposits, depositStatusFilter])

  const filteredUsers = useMemo(() => {
    if (!userSearchQuery) return users
    const query = userSearchQuery.toLowerCase()
    return users.filter((u) => u.email?.toLowerCase().includes(query) || u.fullName?.toLowerCase().includes(query))
  }, [users, userSearchQuery])

  // Filtered transactions based on selected filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const statusMatch = txStatusFilter === "all" || tx.status === txStatusFilter
      const typeMatch = txTypeFilter === "all" || tx.type === txTypeFilter
      return statusMatch && typeMatch
    })
  }, [transactions, txStatusFilter, txTypeFilter])

  useEffect(() => {
    const supabase = createClient()

    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setUser(user)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    if (!loading && isAdmin) {
      fetchCoins()
      fetchTreasuryWallet()
      fetchSettings()
      fetchGiftCards()
      fetchRedemptions()
      fetchTransactions()
      fetchDeposits()
      fetchUsers()
      fetchChartData(chartPeriod)
    }
  }, [loading, isAdmin])

  useEffect(() => {
    if (!loading && isAdmin) {
      fetchChartData(chartPeriod)
    }
  }, [chartPeriod])

  const fetchCoins = async () => {
    setLoadingCoins(true)
    try {
      const res = await fetch("/api/sideshift/coins")
      if (res.ok) {
        const data = await res.json()
        const coinMap = new Map<string, CoinOption>()
        for (const coin of data.coins || []) {
          const key = coin.symbol.toLowerCase()
          if (coinMap.has(key)) {
            const existing = coinMap.get(key)!
            if (!existing.networks) {
              existing.networks = [existing.network]
            }
            if (!existing.networks.includes(coin.network)) {
              existing.networks.push(coin.network)
            }
          } else {
            coinMap.set(key, {
              id: coin.id,
              name: coin.name,
              symbol: coin.symbol,
              network: coin.network,
              networkName: coin.networkName,
              icon: coin.icon,
              hasMemo: coin.hasMemo,
              networks: [coin.network],
            })
          }
        }
        setCoins(Array.from(coinMap.values()))
      }
    } catch (err) {
      console.error("Failed to fetch coins:", err)
    } finally {
      setLoadingCoins(false)
    }
  }

  const fetchTreasuryWallet = async () => {
    try {
      const res = await fetch("/api/admin/wallet")
      if (res.ok) {
        const data = await res.json()
        if (data.wallet) {
          setTreasuryWallet(data.wallet)
          setSelectedCoin(data.wallet.asset?.toUpperCase() || "")
          setSelectedNetwork(data.wallet.network || "")
          setWalletAddress(data.wallet.address || "")
        }
      }
    } catch (err) {
      console.error("Failed to fetch treasury wallet:", err)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings")
      if (res.ok) {
        const data = await res.json()
        if (data.settings) {
          setFeePercentage(data.settings.feePercentage ?? 2.5)
          setFeeMinimum(data.settings.feeMinimum ?? 0.5)
          setGiftCardExpiryDays(data.settings.giftCardExpiryDays ?? 90)
          setMinGiftCardValue(data.settings.minGiftCardValue ?? 5)
          setMaxGiftCardValue(data.settings.maxGiftCardValue ?? 100000)
          setMinDepositValue(data.settings.minDepositValue ?? 5)
          setMaxDepositValue(data.settings.maxDepositValue ?? 100000)
          setAutoProcessRedemptions(data.settings.autoProcessRedemptions ?? false)
        }
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err)
    }
  }

  const fetchGiftCards = async () => {
    try {
      const res = await fetch("/api/admin/gift-cards")
      if (res.ok) {
        const data = await res.json()
        setGiftCards(data.giftCards || [])
        setStats((prev) => ({
          ...prev,
          totalCards: data.stats?.totalCards || 0,
          totalValue: data.stats?.totalValue || 0,
          activeCards: data.stats?.activeCards || 0,
          pendingCards: data.stats?.pendingCards || 0,
          redeemedCards: data.stats?.redeemedCards || 0,
          totalFees: data.stats?.totalFees || 0,
        }))
      }
    } catch (err) {
      console.error("Failed to fetch gift cards:", err)
    }
  }

  const fetchRedemptions = async () => {
    try {
      const res = await fetch("/api/admin/redemptions")
      if (res.ok) {
        const data = await res.json()
        setRedemptions(data.redemptions || [])
        setStats((prev) => ({
          ...prev,
          pendingRedemptions: data.stats?.pending || 0,
          processingRedemptions: data.stats?.processing || 0,
          completedRedemptions: data.stats?.completed || 0,
          totalRedeemed: data.stats?.totalValue || 0,
        }))
      }
    } catch (err) {
      console.error("Failed to fetch redemptions:", err)
    }
  }

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/admin/transactions")
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions || [])
        setTxStats(data.stats || txStats)
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err)
    }
  }

  const fetchDeposits = async () => {
    try {
      const res = await fetch("/api/admin/deposits")
      if (res.ok) {
        const data = await res.json()
        setDeposits(data.deposits || [])
        if (data.stats) {
          setDepositStats(data.stats)
        }
      }
    } catch (err) {
      console.error("Failed to fetch deposits:", err)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users")
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
        if (data.stats) {
          setUserStats(data.stats)
        }
      }
    } catch (err) {
      console.error("Failed to fetch users:", err)
    }
  }

  const fetchChartData = async (period: string) => {
    setLoadingChart(true)
    try {
      const res = await fetch(`/api/admin/stats/chart-data?period=${period}`)
      if (res.ok) {
        const data = await res.json()
        setChartData(data.chartData || [])
        setChartTotals(data.totals || chartTotals)
        setChartStatusBreakdown(data.statusBreakdown || chartStatusBreakdown)
      }
    } catch (err) {
      console.error("Failed to fetch chart data:", err)
    } finally {
      setLoadingChart(false)
    }
  }

  const fetchUserDetail = async (userId: string) => {
    setLoadingUserDetail(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedUser(data)
      }
    } catch (err) {
      console.error("Failed to fetch user details:", err)
    } finally {
      setLoadingUserDetail(false)
    }
  }

  const saveTreasuryWallet = async () => {
    if (!selectedCoin || !selectedNetwork || !walletAddress) {
      toast({
        title: "Missing Information",
        description: "Please fill in all wallet fields",
        variant: "destructive",
      })
      return
    }

    setSavingSettings(true)
    try {
      const res = await fetch("/api/admin/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset: selectedCoin.toLowerCase(),
          network: selectedNetwork,
          address: walletAddress,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setTreasuryWallet(data.wallet)
        toast({
          title: "Wallet Saved",
          description: "Treasury wallet has been configured successfully",
        })
      } else {
        throw new Error("Failed to save wallet")
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save treasury wallet",
        variant: "destructive",
      })
    } finally {
      setSavingSettings(false)
    }
  }

  const deleteTreasuryWallet = async () => {
    if (!treasuryWallet) return

    setDeletingWallet(true)
    try {
      const res = await fetch(`/api/admin/wallet?id=${treasuryWallet.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setTreasuryWallet(null)
        setSelectedCoin("")
        setSelectedNetwork("")
        setWalletAddress("")
        toast({
          title: "Wallet Deleted",
          description: "Treasury wallet has been removed",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete treasury wallet",
        variant: "destructive",
      })
    } finally {
      setDeletingWallet(false)
    }
  }

  const saveSettings = async () => {
    setSavingSettings(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feePercentage,
          feeMinimum,
          giftCardExpiryDays,
          minGiftCardValue,
          maxGiftCardValue,
          minDepositValue,
          maxDepositValue,
          autoProcessRedemptions,
        }),
      })

      if (res.ok) {
        toast({
          title: "Settings Saved",
          description: "Platform settings have been updated successfully",
        })
      } else {
        throw new Error("Failed to save settings")
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setSavingSettings(false)
    }
  }

  const handleGenerateCards = async () => {
    if (genAmount < 5 || genQuantity < 1) {
      toast({
        title: "Invalid Values",
        description: "Please enter valid amount and quantity",
        variant: "destructive",
      })
      return
    }

    setGeneratingCards(true)
    try {
      const res = await fetch("/api/admin/gift-cards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          design: genDesign,
          valueUsd: genAmount,
          quantity: genQuantity,
          recipientName: genRecipientName || undefined,
          message: genMessage || undefined,
          password: genPassword || undefined,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setGeneratedCards(data.cards || [])
        fetchGiftCards()
        toast({
          title: "Cards Generated",
          description: `Successfully generated ${data.cards?.length || genQuantity} gift card(s)`,
        })
      } else {
        throw new Error("Failed to generate cards")
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to generate gift cards",
        variant: "destructive",
      })
    } finally {
      setGeneratingCards(false)
    }
  }

  const processRedemption = async (redemptionId: string) => {
    setProcessingRedemption(redemptionId)
    try {
      const res = await fetch("/api/admin/redemptions/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redemptionId }),
      })

      if (res.ok) {
        toast({
          title: "Processing Started",
          description: "Redemption is being processed",
        })
        fetchRedemptions()
      } else {
        const data = await res.json()
        throw new Error(data.error || "Failed to process redemption")
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to process redemption",
        variant: "destructive",
      })
    } finally {
      setProcessingRedemption(null)
    }
  }

  const changeCardStatus = async (cardCode: string, status: string) => {
    setChangingStatus(true)
    try {
      const res = await fetch("/api/admin/gift-cards/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codes: [cardCode], // Pass as an array
          status,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.summary?.successful > 0) {
          toast({
            title: "Status Updated",
            description: `Card ${cardCode} status changed to ${status}`,
          })
          // Update local state immediately
          setGiftCards((prev) => prev.map((card) => (card.code === cardCode ? { ...card, status } : card)))
          // Update selected card if open
          if (selectedGiftCard?.code === cardCode) {
            setSelectedGiftCard((prev) => (prev ? { ...prev, status } : null))
          }
          // Refresh all data to sync
          fetchGiftCards()
        } else {
          throw new Error(data.results?.[0]?.error || "Failed to update status")
        }
      } else {
        const error = await res.json()
        throw new Error(error.error || "Failed to update status")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to change status",
        variant: "destructive",
      })
    } finally {
      setChangingStatus(false)
      setNewStatus("") // Clear the newStatus after attempt
    }
  }

  const handleBulkStatusUpdate = async () => {
    if (!bulkCodes.trim() || !bulkStatus) {
      toast({
        title: "Missing Information",
        description: "Please enter card codes and select a status",
        variant: "destructive",
      })
      return
    }

    setBulkUpdating(true)
    setBulkResults(null)

    try {
      const response = await fetch("/api/admin/gift-cards/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codes: bulkCodes,
          status: bulkStatus,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update cards")
      }

      setBulkResults(data)

      toast({
        title: "Bulk Update Complete",
        description: data.message,
      })

      // Refresh gift cards list
      fetchGiftCards()

      // Clear the input if all successful
      if (data.summary?.failed === 0) {
        setBulkCodes("")
        setBulkStatus("")
      }
    } catch (error) {
      toast({
        title: "Bulk Update Failed",
        description: error instanceof Error ? error.message : "Failed to update cards",
        variant: "destructive",
      })
    } finally {
      setBulkUpdating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    })
  }

  const refreshAllData = () => {
    fetchGiftCards()
    fetchRedemptions()
    fetchTransactions()
    fetchDeposits()
    fetchUsers()
    fetchChartData(chartPeriod)
    toast({
      title: "Refreshed",
      description: "All data has been refreshed",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You do not have permission to access the admin dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Manage your gift card platform</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refreshAllData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Gift className="w-4 h-4 mr-2" />
                  Generate Cards
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Generate Gift Cards</DialogTitle>
                  <DialogDescription>Create pre-funded gift cards for distribution</DialogDescription>
                </DialogHeader>

                {generatedCards.length > 0 ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                      <div className="flex items-center gap-2 text-emerald-500 mb-2">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">Cards Generated Successfully!</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {generatedCards.length} card(s) have been created and are ready to use.
                      </p>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {generatedCards.map((card) => (
                        <div key={card.id} className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-mono text-sm font-semibold">{card.code}</p>
                              <p className="text-xs text-muted-foreground">
                                ${card.value} - {card.design}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(card.code)}>
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setGeneratedCards([])
                          setGenerateDialogOpen(false)
                        }}
                      >
                        Close
                      </Button>
                      <Button
                        onClick={() => {
                          const codes = generatedCards.map((c) => c.code).join("\n")
                          copyToClipboard(codes)
                        }}
                      >
                        Copy All Codes
                      </Button>
                    </DialogFooter>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <div className="flex flex-wrap gap-2">
                        {CARD_CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => {
                              setGenCategory(cat)
                              const designs = getDesignsByCategory(cat)
                              if (designs.length > 0) setGenDesign(designs[0].id)
                            }}
                            className={cn(
                              "px-3 py-1 rounded-full text-xs font-medium transition-all",
                              genCategory === cat
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80",
                            )}
                          >
                            {getCategoryLabel(cat)}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-4 gap-2 max-h-[120px] overflow-y-auto">
                        {categoryDesigns.map((design) => (
                          <button
                            key={design.id}
                            onClick={() => setGenDesign(design.id)}
                            className={cn(
                              "aspect-[1.6/1] rounded-lg border-2 transition-all text-xs font-medium flex items-center justify-center",
                              genDesign === design.id
                                ? "border-primary ring-2 ring-primary/20"
                                : "border-border hover:border-primary/50",
                            )}
                            style={{ background: `linear-gradient(135deg, ${design.gradient.split(" ").slice(-1)})` }}
                          >
                            <span className="text-white drop-shadow-lg text-[10px]">{design.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Card Value ($)</Label>
                        <Input
                          type="number"
                          value={genAmount}
                          onChange={(e) => setGenAmount(Number(e.target.value))}
                          min={5}
                          max={100000}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={genQuantity}
                          onChange={(e) => setGenQuantity(Number(e.target.value))}
                          min={1}
                          max={100}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Recipient Name (Optional)</Label>
                        <Input
                          value={genRecipientName}
                          onChange={(e) => setGenRecipientName(e.target.value)}
                          placeholder="Who is this for?"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Message (Optional)</Label>
                        <Textarea
                          value={genMessage}
                          onChange={(e) => setGenMessage(e.target.value)}
                          placeholder="Add a personal message..."
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Password Protection (Optional)</Label>
                        <Input
                          type="password"
                          value={genPassword}
                          onChange={(e) => setGenPassword(e.target.value)}
                          placeholder="Set a password to protect the card"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Value</span>
                        <span className="text-xl font-bold">${(genAmount * genQuantity).toLocaleString()}</span>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleGenerateCards} disabled={generatingCards}>
                        {generatingCards ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Gift className="w-4 h-4 mr-2" />
                            Generate {genQuantity} Card{genQuantity > 1 ? "s" : ""}
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-auto min-w-full sm:min-w-0 bg-muted/50 p-1">
              <TabsTrigger
                value="overview"
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Home</span>
              </TabsTrigger>
              {/* Added Analytics Tab */}
              <TabsTrigger
                value="analytics"
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
                <span className="sm:hidden">Charts</span>
              </TabsTrigger>
              {/* Added Users Tab */}
              <TabsTrigger value="users" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Users</span>
                <span className="sm:hidden">Users</span>
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                  {userStats.totalUsers}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="deposits"
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
              >
                <PiggyBank className="w-4 h-4" />
                <span className="hidden sm:inline">Deposits</span>
                <span className="sm:hidden">Dep</span>
                {depositStats.pending > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                    {depositStats.pending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="wallet" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                <Wallet className="w-4 h-4" />
                <span className="hidden sm:inline">Treasury</span>
                <span className="sm:hidden">Wallet</span>
              </TabsTrigger>
              <TabsTrigger value="cards" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                <CreditCard className="w-4 h-4" />
                <span className="hidden sm:inline">Gift Cards</span>
                <span className="sm:hidden">Cards</span>
              </TabsTrigger>
              <TabsTrigger
                value="redemptions"
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
              >
                <Gift className="w-4 h-4" />
                <span className="hidden sm:inline">Redemptions</span>
                <span className="sm:hidden">Redeem</span>
              </TabsTrigger>
              <TabsTrigger
                value="transactions"
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
              >
                <Receipt className="w-4 h-4" />
                <span className="hidden sm:inline">Transactions</span>
                <span className="sm:hidden">Txns</span>
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
                <span className="sm:hidden">Config</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="analytics">
            <div className="space-y-6">
              {/* Period Selector */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Platform Analytics</h2>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <Select value={chartPeriod} onValueChange={setChartPeriod}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">Last 24 Hours</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="90d">Last 90 Days</SelectItem>
                      <SelectItem value="1y">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/20">
                        <PiggyBank className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Deposit Volume</p>
                        <p className="text-lg font-bold">${chartTotals.depositVolume.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{chartTotals.deposits} deposits</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <CreditCard className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Purchase Volume</p>
                        <p className="text-lg font-bold">${chartTotals.purchaseVolume.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{chartTotals.purchases} purchases</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/20">
                        <DollarSign className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Fees Collected</p>
                        <p className="text-lg font-bold">${chartTotals.fees.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Platform revenue</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-pink-500/20">
                        <Users className="w-5 h-5 text-pink-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">New Users</p>
                        <p className="text-lg font-bold">{chartTotals.users}</p>
                        <p className="text-xs text-muted-foreground">This period</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              {loadingChart ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <AdminChartsDashboard
                  chartData={chartData}
                  statusBreakdown={chartStatusBreakdown}
                  totals={chartTotals}
                  period={chartPeriod}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="space-y-6">
              {/* User Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <Users className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Users</p>
                        <p className="text-xl font-bold">{userStats.totalUsers}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/20">
                        <Wallet className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">With Balance</p>
                        <p className="text-xl font-bold">{userStats.usersWithBalance}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/20">
                        <DollarSign className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Balance</p>
                        <p className="text-xl font-bold">${userStats.totalBalanceHeld.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <TrendingUp className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">New (7d)</p>
                        <p className="text-xl font-bold">{userStats.newUsersLast7d}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Users Search and Table */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">All Users</CardTitle>
                    <Input
                      placeholder="Search users..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-[200px]"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Deposited</TableHead>
                          <TableHead>Cards</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm truncate max-w-[200px]">{u.email}</p>
                                {u.fullName && <p className="text-xs text-muted-foreground">{u.fullName}</p>}
                                {u.isAdmin && (
                                  <Badge variant="secondary" className="mt-1 text-xs">
                                    Admin
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "font-semibold",
                                  u.balance > 0 ? "text-emerald-500" : "text-muted-foreground",
                                )}
                              >
                                ${u.balance.toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell>${u.totalDeposited.toFixed(2)}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <span className="text-muted-foreground">{u.cardStats.total} total</span>
                                {u.cardStats.active > 0 && (
                                  <span className="text-emerald-500 ml-2">{u.cardStats.active} active</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => fetchUserDetail(u.id)}>
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>User Details</DialogTitle>
                                    <DialogDescription>{u.email}</DialogDescription>
                                  </DialogHeader>
                                  {loadingUserDetail ? (
                                    <div className="flex items-center justify-center py-10">
                                      <Loader2 className="w-6 h-6 animate-spin" />
                                    </div>
                                  ) : selectedUser ? (
                                    <div className="space-y-4">
                                      {/* User Info */}
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-muted rounded-lg">
                                          <p className="text-xs text-muted-foreground">Current Balance</p>
                                          <p className="text-xl font-bold text-emerald-500">
                                            ${selectedUser.balance.current.toFixed(2)}
                                          </p>
                                        </div>
                                        <div className="p-3 bg-muted rounded-lg">
                                          <p className="text-xs text-muted-foreground">Total Deposited</p>
                                          <p className="text-xl font-bold">
                                            ${selectedUser.balance.totalDeposited.toFixed(2)}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Deposit Stats */}
                                      <div className="p-3 bg-muted/50 rounded-lg">
                                        <p className="text-sm font-medium mb-2">Deposit Activity</p>
                                        <div className="grid grid-cols-4 gap-2 text-center">
                                          <div>
                                            <p className="text-lg font-bold">{selectedUser.depositStats.total}</p>
                                            <p className="text-xs text-muted-foreground">Total</p>
                                          </div>
                                          <div>
                                            <p className="text-lg font-bold text-green-500">
                                              {selectedUser.depositStats.completed}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Completed</p>
                                          </div>
                                          <div>
                                            <p className="text-lg font-bold text-yellow-500">
                                              {selectedUser.depositStats.pending}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Pending</p>
                                          </div>
                                          <div>
                                            <p className="text-lg font-bold text-red-500">
                                              {selectedUser.depositStats.failed}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Failed</p>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Card Stats */}
                                      <div className="p-3 bg-muted/50 rounded-lg">
                                        <p className="text-sm font-medium mb-2">Gift Card Activity</p>
                                        <div className="grid grid-cols-4 gap-2 text-center">
                                          <div>
                                            <p className="text-lg font-bold">{selectedUser.cardStats.total}</p>
                                            <p className="text-xs text-muted-foreground">Total</p>
                                          </div>
                                          <div>
                                            <p className="text-lg font-bold text-green-500">
                                              {selectedUser.cardStats.active}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Active</p>
                                          </div>
                                          <div>
                                            <p className="text-lg font-bold text-blue-500">
                                              {selectedUser.cardStats.redeemed}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Redeemed</p>
                                          </div>
                                          <div>
                                            <p className="text-lg font-bold">
                                              ${selectedUser.cardStats.totalValue.toFixed(0)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Value</p>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Recent Deposits */}
                                      {selectedUser.deposits.length > 0 && (
                                        <div>
                                          <p className="text-sm font-medium mb-2">Recent Deposits</p>
                                          <div className="space-y-2 max-h-[150px] overflow-y-auto">
                                            {selectedUser.deposits.slice(0, 5).map((d: any) => (
                                              <div
                                                key={d.id}
                                                className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                                              >
                                                <div>
                                                  <span className="font-mono">${d.amount_usd}</span>
                                                  <span className="text-muted-foreground ml-2">{d.deposit_coin}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <Badge variant={d.status === "completed" ? "default" : "secondary"}>
                                                    {d.status}
                                                  </Badge>
                                                  <span className="text-xs text-muted-foreground">
                                                    {new Date(d.created_at).toLocaleDateString()}
                                                  </span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Recent Cards */}
                                      {selectedUser.giftCards.length > 0 && (
                                        <div>
                                          <p className="text-sm font-medium mb-2">Recent Gift Cards</p>
                                          <div className="space-y-2 max-h-[150px] overflow-y-auto">
                                            {selectedUser.giftCards.slice(0, 5).map((c: any) => (
                                              <div
                                                key={c.id}
                                                className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                                              >
                                                <div>
                                                  <span className="font-mono">{c.code}</span>
                                                  <span className="text-muted-foreground ml-2">${c.value_usd}</span>
                                                </div>
                                                <Badge variant={c.status === "active" ? "default" : "secondary"}>
                                                  {c.status}
                                                </Badge>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-center text-muted-foreground py-10">No data available</p>
                                  )}
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Quick Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card className="bg-card border-border">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex items-center gap-2 sm:gap-4">
                      <div className="p-2 sm:p-3 rounded-full bg-emerald-500/10 flex-shrink-0">
                        <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Cards</p>
                        <p className="text-lg sm:text-2xl font-bold">{stats.totalCards}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex items-center gap-2 sm:gap-4">
                      <div className="p-2 sm:p-3 rounded-full bg-green-500/10 flex-shrink-0">
                        <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Value</p>
                        <p className="text-lg sm:text-2xl font-bold">${stats.totalValue.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex items-center gap-2 sm:gap-4">
                      <div className="p-2 sm:p-3 rounded-full bg-blue-500/10 flex-shrink-0">
                        <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Fees</p>
                        <p className="text-lg sm:text-2xl font-bold">${stats.totalFees.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex items-center gap-2 sm:gap-4">
                      <div className="p-2 sm:p-3 rounded-full bg-yellow-500/10 flex-shrink-0">
                        <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">Pending</p>
                        <p className="text-lg sm:text-2xl font-bold">{stats.pendingRedemptions}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Stats Sections */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Users Stats */}
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="w-4 h-4 text-pink-500" />
                      Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Total Users</span>
                      <span className="font-semibold">{userStats.totalUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">With Balance</span>
                      <span className="font-semibold text-green-500">{userStats.usersWithBalance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Total Held</span>
                      <span className="font-semibold text-emerald-500">${userStats.totalBalanceHeld.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">New (7d)</span>
                      <span className="font-semibold text-blue-500">{userStats.newUsersLast7d}</span>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <Button variant="ghost" size="sm" className="w-full" onClick={() => setActiveTab("users")}>
                        View All Users <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Deposits Stats */}
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <PiggyBank className="w-4 h-4 text-emerald-500" />
                      Deposits
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Total Deposits</span>
                      <span className="font-semibold">{depositStats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Completed</span>
                      <span className="font-semibold text-green-500">{depositStats.completed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Pending</span>
                      <span className="font-semibold text-yellow-500">{depositStats.pending}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Total Received</span>
                      <span className="font-semibold text-emerald-500">${depositStats.totalReceived.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <Button variant="ghost" size="sm" className="w-full" onClick={() => setActiveTab("deposits")}>
                        View All Deposits <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Gift Cards Stats */}
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-500" />
                      Gift Cards
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Total Created</span>
                      <span className="font-semibold">{stats.totalCards}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Active</span>
                      <span className="font-semibold text-green-500">{stats.activeCards}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Redeemed</span>
                      <span className="font-semibold text-blue-500">{stats.redeemedCards}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Pending</span>
                      <span className="font-semibold text-yellow-500">{stats.pendingCards}</span>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <Button variant="ghost" size="sm" className="w-full" onClick={() => setActiveTab("cards")}>
                        View All Cards <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Redemptions Stats */}
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Gift className="w-4 h-4 text-purple-500" />
                      Redemptions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Total Redeemed</span>
                      <span className="font-semibold">${stats.totalRedeemed.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Completed</span>
                      <span className="font-semibold text-green-500">{stats.completedRedemptions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Processing</span>
                      <span className="font-semibold text-blue-500">{stats.processingRedemptions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Pending</span>
                      <span className="font-semibold text-yellow-500">{stats.pendingRedemptions}</span>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <Button variant="ghost" size="sm" className="w-full" onClick={() => setActiveTab("redemptions")}>
                        View All Redemptions <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Volume Over Time */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-500" />
                      Volume Summary
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab("analytics")}>
                      View Charts <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Last 24 Hours</p>
                      <p className="text-xl font-bold text-emerald-500">${depositStats.volume24h.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{depositStats.last24h} deposits</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Last 7 Days</p>
                      <p className="text-xl font-bold text-emerald-500">${depositStats.volume7d.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{depositStats.last7d} deposits</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Last 30 Days</p>
                      <p className="text-xl font-bold text-emerald-500">${depositStats.volume30d.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{depositStats.last30d} deposits</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Treasury warning */}
              {!treasuryWallet && (
                <Card className="bg-yellow-500/10 border-yellow-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <AlertTriangle className="w-8 h-8 text-yellow-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">Treasury Wallet Not Configured</p>
                        <p className="text-sm text-muted-foreground">
                          Please configure a treasury wallet to receive payments and process redemptions.
                        </p>
                      </div>
                      <Button
                        onClick={() => setActiveTab("wallet")}
                        className="bg-yellow-500 text-black hover:bg-yellow-400 flex-shrink-0"
                      >
                        Configure Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="deposits">
            <div className="space-y-6">
              {/* Deposit Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/20">
                        <PiggyBank className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Deposits</p>
                        <p className="text-xl font-bold">{depositStats.total}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Completed</p>
                        <p className="text-xl font-bold">{depositStats.completed}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-yellow-500/20">
                        <Clock className="w-5 h-5 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pending</p>
                        <p className="text-xl font-bold">{depositStats.pending}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <DollarSign className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Received</p>
                        <p className="text-xl font-bold">${depositStats.totalReceived.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-4">
                <Select value={depositStatusFilter} onValueChange={setDepositStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Deposits Table */}
              <Card className="bg-card border-border">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Received</TableHead>
                          <TableHead>Crypto</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDeposits.map((deposit) => (
                          <TableRow key={deposit.id}>
                            <TableCell>
                              <span className="text-sm truncate max-w-[150px] block">
                                {deposit.profiles?.email || deposit.user_id.slice(0, 8)}
                              </span>
                            </TableCell>
                            <TableCell>${deposit.amount_usd?.toFixed(2)}</TableCell>
                            <TableCell className="text-emerald-500">
                              ${(deposit.settled_amount || 0).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <span className="uppercase">{deposit.deposit_coin}</span>
                                <span className="text-xs text-muted-foreground">({deposit.deposit_network})</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  deposit.status === "completed"
                                    ? "default"
                                    : deposit.status === "pending"
                                      ? "secondary"
                                      : "destructive"
                                }
                              >
                                {deposit.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(deposit.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => setSelectedDeposit(deposit)}>
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Deposit Details</DialogTitle>
                                  </DialogHeader>
                                  {selectedDeposit && (
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <p className="text-xs text-muted-foreground">User</p>
                                          <p className="font-medium truncate">
                                            {selectedDeposit.profiles?.email || selectedDeposit.user_id}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-muted-foreground">Status</p>
                                          <Badge
                                            variant={selectedDeposit.status === "completed" ? "default" : "secondary"}
                                          >
                                            {selectedDeposit.status}
                                          </Badge>
                                        </div>
                                        <div>
                                          <p className="text-xs text-muted-foreground">Requested</p>
                                          <p className="font-medium">${selectedDeposit.amount_usd?.toFixed(2)}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-muted-foreground">Received</p>
                                          <p className="font-medium text-emerald-500">
                                            ${(selectedDeposit.settled_amount || 0).toFixed(2)}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-muted-foreground">Crypto</p>
                                          <p className="font-medium uppercase">
                                            {selectedDeposit.deposit_coin} ({selectedDeposit.deposit_network})
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-muted-foreground">Created</p>
                                          <p className="font-medium">
                                            {new Date(selectedDeposit.created_at).toLocaleString()}
                                          </p>
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">Deposit Address</p>
                                        <div className="flex items-center gap-2">
                                          <code className="text-xs bg-muted p-2 rounded flex-1 break-all">
                                            {selectedDeposit.deposit_address}
                                          </code>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(selectedDeposit.deposit_address)}
                                          >
                                            <Copy className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">Shift ID</p>
                                        <code className="text-xs bg-muted p-2 rounded block break-all">
                                          {selectedDeposit.shift_id}
                                        </code>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="wallet">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-500" />
                  Treasury Wallet
                </CardTitle>
                <CardDescription>
                  Configure the wallet address where you want to receive payments from gift card purchases.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {treasuryWallet ? (
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getCoinIconUrl(treasuryWallet.asset.toLowerCase()) && (
                          <Image
                            src={getCoinIconUrl(treasuryWallet.asset.toLowerCase()) || "/placeholder.svg"}
                            alt={treasuryWallet.asset}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        )}
                        <div>
                          <p className="font-semibold">
                            {treasuryWallet.asset} ({treasuryWallet.network})
                          </p>
                          <p className="text-sm text-muted-foreground font-mono break-all">{treasuryWallet.address}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                        <Check className="w-3 h-3 mr-1" />
                        Primary
                      </Badge>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove Wallet
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Treasury Wallet?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the treasury wallet. You will not be able to receive payments until a new
                            wallet is configured.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={deleteTreasuryWallet} disabled={deletingWallet}>
                            {deletingWallet ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Cryptocurrency</Label>
                        <Select
                          value={selectedCoin}
                          onValueChange={(val) => {
                            setSelectedCoin(val)
                            setSelectedNetwork("")
                          }}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select cryptocurrency" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {loadingCoins ? (
                              <div className="p-4 text-center">
                                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                              </div>
                            ) : (
                              coins.map((coin) => (
                                <SelectItem key={coin.symbol.toLowerCase()} value={coin.symbol.toLowerCase()}>
                                  <div className="flex items-center gap-2">
                                    {coin.icon && (
                                      <Image
                                        src={coin.icon || "/placeholder.svg"}
                                        alt={coin.name}
                                        width={20}
                                        height={20}
                                        className="rounded-full"
                                      />
                                    )}
                                    {coin.name} ({coin.symbol.toUpperCase()})
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedCoin && availableNetworks.length > 0 && (
                        <div className="space-y-2">
                          <Label>Network</Label>
                          <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select network" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableNetworks.map((network) => (
                                <SelectItem key={network} value={network}>
                                  {network}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Wallet Address</Label>
                        <Input
                          value={walletAddress}
                          onChange={(e) => setWalletAddress(e.target.value)}
                          placeholder="Enter your wallet address"
                          className="font-mono"
                        />
                      </div>

                      <Button
                        onClick={saveTreasuryWallet}
                        disabled={savingSettings || !selectedCoin || !selectedNetwork || !walletAddress}
                        className="w-full"
                      >
                        {savingSettings ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Save Treasury Wallet
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30 border border-border">
                      <h3 className="font-semibold mb-2">Important Notes</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>All gift card payments will be sent to this wallet</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>Make sure the address is correct for the selected network</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>Double-check the address before saving</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cards">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-500" />
                  Gift Cards ({giftCards.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-emerald-500" />
                    <h3 className="font-semibold">Bulk Status Update</h3>
                    <span className="text-xs text-muted-foreground">(up to 50 cards at once)</span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[1fr,200px,auto]">
                    <div>
                      <Label htmlFor="bulkCodes" className="text-xs text-muted-foreground mb-1 block">
                        Card Codes (comma or newline separated)
                      </Label>
                      <Textarea
                        id="bulkCodes"
                        placeholder="STARIX-XXXX-XXXX-XXXX, STARIX-YYYY-YYYY-YYYY"
                        value={bulkCodes}
                        onChange={(e) => setBulkCodes(e.target.value)}
                        className="h-20 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">New Status</Label>
                      <Select value={bulkStatus} onValueChange={setBulkStatus}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-yellow-500" />
                              Pending
                            </span>
                          </SelectItem>
                          <SelectItem value="active">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          </SelectItem>
                          <SelectItem value="redeemed">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              Redeemed
                            </span>
                          </SelectItem>
                          <SelectItem value="expired">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-gray-500" />
                              Expired
                            </span>
                          </SelectItem>
                          <SelectItem value="cancelled">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-red-500" />
                              Cancelled
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <Button
                        onClick={handleBulkStatusUpdate}
                        disabled={bulkUpdating || !bulkCodes.trim() || !bulkStatus}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        {bulkUpdating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Update All
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Bulk results display */}
                  {bulkResults && (
                    <div className="mt-4 p-3 rounded-lg bg-background border border-border">
                      <div className="flex items-center gap-4 mb-2">
                        <span
                          className={cn(
                            "font-medium",
                            bulkResults.summary?.failed === 0 ? "text-emerald-500" : "text-yellow-500",
                          )}
                        >
                          {bulkResults.message}
                        </span>
                      </div>

                      {bulkResults.summary && (
                        <div className="flex gap-4 text-xs text-muted-foreground mb-2">
                          <span>Total: {bulkResults.summary.total}</span>
                          <span className="text-emerald-500">Success: {bulkResults.summary.successful}</span>
                          {bulkResults.summary.failed > 0 && (
                            <span className="text-red-500">Failed: {bulkResults.summary.failed}</span>
                          )}
                          {bulkResults.summary.notFound > 0 && (
                            <span className="text-yellow-500">Not Found: {bulkResults.summary.notFound}</span>
                          )}
                        </div>
                      )}

                      {bulkResults.results && bulkResults.results.some((r) => !r.success) && (
                        <div className="mt-2 max-h-32 overflow-y-auto">
                          <p className="text-xs font-medium text-red-500 mb-1">Failed cards:</p>
                          {bulkResults.results
                            .filter((r) => !r.success)
                            .map((r, i) => (
                              <div key={i} className="text-xs text-muted-foreground font-mono">
                                {r.code}: {r.error}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Creator/Buyer</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Fee</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {giftCards.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No gift cards found
                          </TableCell>
                        </TableRow>
                      ) : (
                        giftCards.slice(0, 50).map((card) => (
                          <TableRow key={card.id}>
                            <TableCell className="font-mono text-xs">{card.code}</TableCell>
                            <TableCell className="font-bold">${card.value_usd}</TableCell>
                            <TableCell className="text-xs truncate max-w-[150px]">
                              {card.creator?.email || card.buyer_email || "-"}
                            </TableCell>
                            <TableCell className="truncate max-w-[120px]">{card.recipient_name || "-"}</TableCell>
                            <TableCell className="text-emerald-500">${(card.platform_fee || 0).toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getStatusColor(card.status)}>
                                {card.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(card.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(card.code)}>
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedGiftCard(card)}>
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-lg">
                                    <DialogHeader>
                                      <DialogTitle>Gift Card Details</DialogTitle>
                                      <DialogDescription>Full information for card {card.code}</DialogDescription>
                                    </DialogHeader>
                                    {selectedGiftCard && selectedGiftCard.id === card.id && (
                                      <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <p className="text-xs text-muted-foreground">Code</p>
                                            <p className="font-mono font-medium">{selectedGiftCard.code}</p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-muted-foreground mb-1">Status</p>
                                            <div className="flex items-center gap-2">
                                              <Select
                                                value={newStatus || selectedGiftCard.status}
                                                onValueChange={(value) => setNewStatus(value)}
                                                disabled={changingStatus}
                                              >
                                                <SelectTrigger className="w-[140px] h-8">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="pending">
                                                    <span className="flex items-center gap-2">
                                                      <span className="w-2 h-2 rounded-full bg-yellow-500" />
                                                      Pending
                                                    </span>
                                                  </SelectItem>
                                                  <SelectItem value="active">
                                                    <span className="flex items-center gap-2">
                                                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                      Active
                                                    </span>
                                                  </SelectItem>
                                                  <SelectItem value="redeemed">
                                                    <span className="flex items-center gap-2">
                                                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                                                      Redeemed
                                                    </span>
                                                  </SelectItem>
                                                  <SelectItem value="expired">
                                                    <span className="flex items-center gap-2">
                                                      <span className="w-2 h-2 rounded-full bg-gray-500" />
                                                      Expired
                                                    </span>
                                                  </SelectItem>
                                                  <SelectItem value="cancelled">
                                                    <span className="flex items-center gap-2">
                                                      <span className="w-2 h-2 rounded-full bg-red-500" />
                                                      Cancelled
                                                    </span>
                                                  </SelectItem>
                                                </SelectContent>
                                              </Select>
                                              {newStatus && newStatus !== selectedGiftCard.status && (
                                                <Button
                                                  size="sm"
                                                  onClick={() => changeCardStatus(selectedGiftCard.code, newStatus)}
                                                  disabled={changingStatus}
                                                  className="h-8"
                                                >
                                                  {changingStatus ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                  ) : (
                                                    <Check className="w-4 h-4" />
                                                  )}
                                                </Button>
                                              )}
                                            </div>
                                          </div>
                                          <div>
                                            <p className="text-xs text-muted-foreground">Value</p>
                                            <p className="font-bold text-lg">${selectedGiftCard.value_usd}</p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-muted-foreground">Platform Fee</p>
                                            <p className="font-medium text-emerald-500">
                                              ${(selectedGiftCard.platform_fee || 0).toFixed(2)}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="border-t border-border pt-4">
                                          <p className="text-sm font-medium mb-2">User Information</p>
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <p className="text-xs text-muted-foreground">Creator/Buyer Email</p>
                                              <p className="font-medium truncate">
                                                {selectedGiftCard.creator?.email ||
                                                  selectedGiftCard.buyer_email ||
                                                  "N/A"}
                                              </p>
                                            </div>
                                            <div>
                                              <p className="text-xs text-muted-foreground">Creator Name</p>
                                              <p className="font-medium">
                                                {selectedGiftCard.creator?.full_name ||
                                                  selectedGiftCard.sender_name ||
                                                  "N/A"}
                                              </p>
                                            </div>
                                            <div>
                                              <p className="text-xs text-muted-foreground">Recipient Name</p>
                                              <p className="font-medium">{selectedGiftCard.recipient_name || "N/A"}</p>
                                            </div>
                                            <div>
                                              <p className="text-xs text-muted-foreground">Recipient Email</p>
                                              <p className="font-medium truncate">
                                                {selectedGiftCard.recipient_email || "N/A"}
                                              </p>
                                            </div>
                                          </div>
                                        </div>

                                        {selectedGiftCard.message && (
                                          <div className="border-t border-border pt-4">
                                            <p className="text-xs text-muted-foreground mb-1">Message</p>
                                            <p className="text-sm bg-muted p-2 rounded">{selectedGiftCard.message}</p>
                                          </div>
                                        )}

                                        <div className="border-t border-border pt-4">
                                          <p className="text-sm font-medium mb-2">Payment Information</p>
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <p className="text-xs text-muted-foreground">Payment Crypto</p>
                                              <p className="font-medium uppercase">
                                                {selectedGiftCard.payment_crypto || "N/A"}
                                              </p>
                                            </div>
                                            <div>
                                              <p className="text-xs text-muted-foreground">Total Paid</p>
                                              <p className="font-medium">
                                                ${(selectedGiftCard.total_paid || 0).toFixed(2)}
                                              </p>
                                            </div>
                                          </div>
                                          {selectedGiftCard.payment_tx_hash && (
                                            <div className="mt-2">
                                              <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
                                              <code className="text-xs bg-muted p-2 rounded block break-all">
                                                {selectedGiftCard.payment_tx_hash}
                                              </code>
                                            </div>
                                          )}
                                        </div>

                                        <div className="border-t border-border pt-4">
                                          <p className="text-sm font-medium mb-2">Dates</p>
                                          <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                              <p className="text-xs text-muted-foreground">Created</p>
                                              <p>{new Date(selectedGiftCard.created_at).toLocaleString()}</p>
                                            </div>
                                            <div>
                                              <p className="text-xs text-muted-foreground">Expires</p>
                                              <p>
                                                {selectedGiftCard.expires_at
                                                  ? new Date(selectedGiftCard.expires_at).toLocaleString()
                                                  : "N/A"}
                                              </p>
                                            </div>
                                            {selectedGiftCard.redeemed_at && (
                                              <div>
                                                <p className="text-xs text-muted-foreground">Redeemed</p>
                                                <p>{new Date(selectedGiftCard.redeemed_at).toLocaleString()}</p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="redemptions">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-emerald-500" />
                  Redemptions ({redemptions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Card Code</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Card Buyer</TableHead>
                        <TableHead>Crypto</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {redemptions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No redemptions found
                          </TableCell>
                        </TableRow>
                      ) : (
                        redemptions.map((redemption) => (
                          <TableRow key={redemption.id}>
                            <TableCell className="font-mono text-xs">{redemption.gift_card_code}</TableCell>
                            <TableCell className="font-bold">${redemption.value_usd}</TableCell>
                            <TableCell className="text-xs truncate max-w-[150px]">
                              {redemption.gift_card?.buyer_email || "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {redemption.settle_coin && (
                                  <Image
                                    src={getCoinIconUrl(redemption.settle_coin.toLowerCase()) || "/placeholder.svg"}
                                    alt={redemption.settle_coin}
                                    width={20}
                                    height={20}
                                    className="rounded-full"
                                  />
                                )}
                                <span className="text-xs">{redemption.settle_coin?.toUpperCase()}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-emerald-500">
                              {redemption.actual_amount?.toFixed(6) || redemption.estimated_amount?.toFixed(6) || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getStatusColor(redemption.status)}>
                                {redemption.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(redemption.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {(redemption.status === "pending" || redemption.status === "waiting") && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => processRedemption(redemption.id)}
                                    disabled={processingRedemption === redemption.id}
                                  >
                                    {processingRedemption === redemption.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <ArrowUpRight className="w-4 h-4" />
                                    )}
                                  </Button>
                                )}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedRedemption(redemption)}>
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-lg">
                                    <DialogHeader>
                                      <DialogTitle>Redemption Details</DialogTitle>
                                      <DialogDescription>Full information for redemption</DialogDescription>
                                    </DialogHeader>
                                    {selectedRedemption && selectedRedemption.id === redemption.id && (
                                      <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <p className="text-xs text-muted-foreground">Gift Card Code</p>
                                            <p className="font-mono font-medium">{selectedRedemption.gift_card_code}</p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-muted-foreground">Status</p>
                                            <Badge
                                              variant="outline"
                                              className={getStatusColor(selectedRedemption.status)}
                                            >
                                              {selectedRedemption.status}
                                            </Badge>
                                          </div>
                                          <div>
                                            <p className="text-xs text-muted-foreground">Card Value</p>
                                            <p className="font-bold text-lg">${selectedRedemption.value_usd}</p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-muted-foreground">Amount Received</p>
                                            <p className="font-medium text-emerald-500">
                                              {selectedRedemption.actual_amount?.toFixed(6) ||
                                                selectedRedemption.estimated_amount?.toFixed(6) ||
                                                "Pending"}{" "}
                                              {selectedRedemption.settle_coin?.toUpperCase()}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="border-t border-border pt-4">
                                          <p className="text-sm font-medium mb-2">Gift Card Info</p>
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <p className="text-xs text-muted-foreground">Buyer Email</p>
                                              <p className="font-medium truncate">
                                                {selectedRedemption.gift_card?.buyer_email || "N/A"}
                                              </p>
                                            </div>
                                            <div>
                                              <p className="text-xs text-muted-foreground">Original Value</p>
                                              <p className="font-medium">
                                                $
                                                {selectedRedemption.gift_card?.value_usd ||
                                                  selectedRedemption.value_usd}
                                              </p>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="border-t border-border pt-4">
                                          <p className="text-sm font-medium mb-2">Payout Information</p>
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <p className="text-xs text-muted-foreground">Cryptocurrency</p>
                                              <p className="font-medium uppercase">
                                                {selectedRedemption.settle_coin} ({selectedRedemption.settle_network})
                                              </p>
                                            </div>
                                            <div>
                                              <p className="text-xs text-muted-foreground">Deposit Amount</p>
                                              <p className="font-medium">
                                                {selectedRedemption.deposit_amount || "N/A"}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="mt-2">
                                            <p className="text-xs text-muted-foreground mb-1">Recipient Address</p>
                                            <code className="text-xs bg-muted p-2 rounded block break-all">
                                              {selectedRedemption.settle_address}
                                            </code>
                                          </div>
                                        </div>

                                        {selectedRedemption.shift_id && (
                                          <div className="border-t border-border pt-4">
                                            <p className="text-sm font-medium mb-2">SideShift Details</p>
                                            <div>
                                              <p className="text-xs text-muted-foreground mb-1">Shift ID</p>
                                              <code className="text-xs bg-muted p-2 rounded block break-all">
                                                {selectedRedemption.shift_id}
                                              </code>
                                            </div>
                                            {selectedRedemption.treasury_tx_hash && (
                                              <div className="mt-2">
                                                <p className="text-xs text-muted-foreground mb-1">Treasury TX Hash</p>
                                                <code className="text-xs bg-muted p-2 rounded block break-all">
                                                  {selectedRedemption.treasury_tx_hash}
                                                </code>
                                              </div>
                                            )}
                                            {selectedRedemption.settle_tx_hash && (
                                              <div className="mt-2">
                                                <p className="text-xs text-muted-foreground mb-1">Settle TX Hash</p>
                                                <code className="text-xs bg-muted p-2 rounded block break-all">
                                                  {selectedRedemption.settle_tx_hash}
                                                </code>
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {selectedRedemption.error_message && (
                                          <div className="border-t border-border pt-4">
                                            <p className="text-xs text-muted-foreground mb-1">Error</p>
                                            <p className="text-sm text-red-500 bg-red-500/10 p-2 rounded">
                                              {selectedRedemption.error_message}
                                            </p>
                                          </div>
                                        )}

                                        <div className="border-t border-border pt-4">
                                          <p className="text-sm font-medium mb-2">Dates</p>
                                          <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                              <p className="text-xs text-muted-foreground">Created</p>
                                              <p>{new Date(selectedRedemption.created_at).toLocaleString()}</p>
                                            </div>
                                            {selectedRedemption.completed_at && (
                                              <div>
                                                <p className="text-xs text-muted-foreground">Completed</p>
                                                <p>{new Date(selectedRedemption.completed_at).toLocaleString()}</p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <ArrowDownLeft className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Purchases</p>
                        <p className="text-xl font-bold">{txStats.totalPurchases}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <ArrowUpRight className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Redemptions</p>
                        <p className="text-xl font-bold">{txStats.totalRedemptions}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-yellow-500/20">
                        <Clock className="w-5 h-5 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pending</p>
                        <p className="text-xl font-bold">{txStats.pendingTransactions}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-red-500/20">
                        <XCircle className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Failed</p>
                        <p className="text-xl font-bold">{txStats.failedTransactions}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-emerald-500" />
                      All Transactions ({filteredTransactions.length})
                    </CardTitle>
                    <div className="flex gap-2">
                      <Select value={txStatusFilter} onValueChange={setTxStatusFilter}>
                        <SelectTrigger className="w-[130px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="waiting">Waiting</SelectItem>
                          <SelectItem value="settled">Settled</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={txTypeFilter} onValueChange={setTxTypeFilter}>
                        <SelectTrigger className="w-[130px]">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="purchase">Purchase</SelectItem>
                          <SelectItem value="redemption">Redemption</SelectItem>
                          <SelectItem value="deposit">Deposit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Shift ID</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No transactions found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredTransactions.slice(0, 50).map((tx) => (
                            <TableRow key={tx.id}>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    tx.type === "purchase"
                                      ? "bg-green-500/20 text-green-400"
                                      : tx.type === "redemption"
                                        ? "bg-blue-500/20 text-blue-400"
                                        : "bg-emerald-500/20 text-emerald-400"
                                  }
                                >
                                  {tx.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono text-xs">{tx.sideshift_id?.slice(0, 12)}...</TableCell>
                              <TableCell>
                                <span className="text-xs">
                                  {tx.deposit_amount?.toFixed(4)} {tx.deposit_coin?.toUpperCase()}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-xs">
                                  {tx.settle_amount?.toFixed(4)} {tx.settle_coin?.toUpperCase()}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={getStatusColor(tx.status)}>
                                  {tx.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(tx.created_at).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-emerald-500" />
                  Platform Settings
                </CardTitle>
                <CardDescription>Configure fees, limits, and platform behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      Fee Settings
                    </h3>
                    <div className="space-y-2">
                      <Label>Service Fee (%)</Label>
                      <Input
                        type="number"
                        value={feePercentage}
                        onChange={(e) => setFeePercentage(Number(e.target.value))}
                        min={0}
                        max={10}
                        step={0.1}
                      />
                      <p className="text-xs text-muted-foreground">Percentage charged on gift card purchases</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Minimum Fee ($)</Label>
                      <Input
                        type="number"
                        value={feeMinimum}
                        onChange={(e) => setFeeMinimum(Number(e.target.value))}
                        min={0}
                        step={0.1}
                      />
                      <p className="text-xs text-muted-foreground">Minimum fee amount regardless of percentage</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Gift Card Limits
                    </h3>
                    <div className="space-y-2">
                      <Label>Minimum Card Value ($)</Label>
                      <Input
                        type="number"
                        value={minGiftCardValue}
                        onChange={(e) => setMinGiftCardValue(Number(e.target.value))}
                        min={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Maximum Card Value ($)</Label>
                      <Input
                        type="number"
                        value={maxGiftCardValue}
                        onChange={(e) => setMaxGiftCardValue(Number(e.target.value))}
                        min={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Card Expiry (Days)</Label>
                      <Input
                        type="number"
                        value={giftCardExpiryDays}
                        onChange={(e) => setGiftCardExpiryDays(Number(e.target.value))}
                        min={1}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <PiggyBank className="w-4 h-4" />
                      Deposit Limits
                    </h3>
                    <div className="space-y-2">
                      <Label>Minimum Deposit ($)</Label>
                      <Input
                        type="number"
                        value={minDepositValue}
                        onChange={(e) => setMinDepositValue(Number(e.target.value))}
                        min={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Maximum Deposit ($)</Label>
                      <Input
                        type="number"
                        value={maxDepositValue}
                        onChange={(e) => setMaxDepositValue(Number(e.target.value))}
                        min={1}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Automation
                    </h3>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">Auto-Process Redemptions</p>
                        <p className="text-sm text-muted-foreground">Automatically process pending redemptions</p>
                      </div>
                      <Switch checked={autoProcessRedemptions} onCheckedChange={setAutoProcessRedemptions} />
                    </div>
                  </div>
                </div>

                <Button onClick={saveSettings} disabled={savingSettings} className="w-full md:w-auto">
                  {savingSettings ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
