"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Gift,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Wallet,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: { value: number; label: string }
  badge?: { text: string; variant: "default" | "success" | "warning" | "destructive" }
  className?: string
}

function StatCard({ title, value, subtitle, icon, trend, badge, className }: StatCardProps) {
  return (
    <Card className={cn("bg-card border-border relative overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">{value}</div>
          {badge && (
            <Badge
              className={cn(
                "text-xs",
                badge.variant === "success" && "bg-green-500/20 text-green-400 border-green-500/30",
                badge.variant === "warning" && "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
                badge.variant === "destructive" && "bg-red-500/20 text-red-400 border-red-500/30",
              )}
            >
              {badge.text}
            </Badge>
          )}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            {trend.value >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-green-500" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-500" />
            )}
            <span className={cn("text-xs font-medium", trend.value >= 0 ? "text-green-500" : "text-red-500")}>
              {trend.value >= 0 ? "+" : ""}
              {trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface AdminStatsCardsProps {
  stats: {
    totalCards: number
    totalValue: number
    activeCards: number
    pendingCards: number
    redeemedCards: number
    totalFees: number
    pendingRedemptions: number
    processingRedemptions: number
    completedRedemptions: number
    totalRedeemed: number
  }
  previousStats?: {
    totalCards: number
    totalValue: number
    totalFees: number
  }
}

export function AdminStatsCards({ stats, previousStats }: AdminStatsCardsProps) {
  const calculateTrend = (current: number, previous: number) => {
    if (!previous || previous === 0) return 0
    return Math.round(((current - previous) / previous) * 100)
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
    return `$${value.toFixed(2)}`
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Gift Cards"
        value={stats.totalCards.toLocaleString()}
        subtitle={`${stats.activeCards} active, ${stats.pendingCards} pending`}
        icon={<Gift className="w-4 h-4" />}
        trend={
          previousStats
            ? {
                value: calculateTrend(stats.totalCards, previousStats.totalCards),
                label: "vs last period",
              }
            : undefined
        }
      />
      <StatCard
        title="Total Value Sold"
        value={formatCurrency(stats.totalValue)}
        subtitle={`${formatCurrency(stats.totalValue - stats.totalRedeemed)} outstanding`}
        icon={<DollarSign className="w-4 h-4" />}
        trend={
          previousStats
            ? {
                value: calculateTrend(stats.totalValue, previousStats.totalValue),
                label: "vs last period",
              }
            : undefined
        }
      />
      <StatCard
        title="Fees Collected"
        value={formatCurrency(stats.totalFees)}
        subtitle={`${((stats.totalFees / (stats.totalValue || 1)) * 100).toFixed(1)}% avg fee rate`}
        icon={<Percent className="w-4 h-4" />}
        trend={
          previousStats
            ? {
                value: calculateTrend(stats.totalFees, previousStats.totalFees),
                label: "vs last period",
              }
            : undefined
        }
        badge={stats.totalFees > 0 ? { text: "Revenue", variant: "success" } : undefined}
      />
      <StatCard
        title="Redemptions"
        value={stats.completedRedemptions.toLocaleString()}
        subtitle={`${stats.pendingRedemptions + stats.processingRedemptions} pending`}
        icon={<ArrowUpRight className="w-4 h-4" />}
        badge={
          stats.pendingRedemptions > 0 ? { text: `${stats.pendingRedemptions} waiting`, variant: "warning" } : undefined
        }
      />
    </div>
  )
}

interface DetailedStatsGridProps {
  cardStats: {
    total: number
    pending: number
    active: number
    redeemed: number
    expired: number
    cancelled: number
    totalValue: number
    activeValue: number
    redeemedValue: number
  }
  revenueStats: {
    totalFeesCollected: number
    totalPaymentsReceived: number
    feesLast24h: number
    feesLast7d: number
    feesLast30d: number
  }
  redemptionStats: {
    total: number
    pending: number
    completed: number
    failed: number
    totalValueRedeemed: number
    totalSent: number
  }
  userStats: {
    total: number
    last24h: number
    last7d: number
    totalBalances: number
    totalDeposited: number
    totalSpent: number
  }
  platformHealth: {
    outstandingLiability: number
    bufferFromFees: number
    netPosition: number
  }
}

export function DetailedStatsGrid({
  cardStats,
  revenueStats,
  redemptionStats,
  userStats,
  platformHealth,
}: DetailedStatsGridProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
    return `$${value.toFixed(2)}`
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Card Status Breakdown */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" />
            Card Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm">Active</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium">{cardStats.active}</span>
              <span className="text-xs text-muted-foreground ml-2">{formatCurrency(cardStats.activeValue)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-sm">Pending</span>
            </div>
            <span className="text-sm font-medium">{cardStats.pending}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-sm">Redeemed</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium">{cardStats.redeemed}</span>
              <span className="text-xs text-muted-foreground ml-2">{formatCurrency(cardStats.redeemedValue)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-sm">Expired/Cancelled</span>
            </div>
            <span className="text-sm font-medium">{cardStats.expired + cardStats.cancelled}</span>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Breakdown */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            Revenue
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Total Fees</span>
            <span className="text-sm font-medium text-green-500">
              {formatCurrency(revenueStats.totalFeesCollected)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last 24h</span>
            <span className="text-sm">{formatCurrency(revenueStats.feesLast24h)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last 7d</span>
            <span className="text-sm">{formatCurrency(revenueStats.feesLast7d)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last 30d</span>
            <span className="text-sm">{formatCurrency(revenueStats.feesLast30d)}</span>
          </div>
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Received</span>
              <span className="text-sm font-medium">{formatCurrency(revenueStats.totalPaymentsReceived)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Health */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-primary" />
            Platform Health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Outstanding Liability</span>
            <span className="text-sm font-medium text-yellow-500">
              {formatCurrency(platformHealth.outstandingLiability)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Buffer (Fees)</span>
            <span className="text-sm font-medium text-green-500">{formatCurrency(platformHealth.bufferFromFees)}</span>
          </div>
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Net Position</span>
              <span
                className={cn("text-sm font-bold", platformHealth.netPosition >= 0 ? "text-green-500" : "text-red-500")}
              >
                {platformHealth.netPosition >= 0 ? "+" : ""}
                {formatCurrency(platformHealth.netPosition)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Redemption Status */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-primary" />
            Redemptions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Completed</span>
            </div>
            <span className="text-sm font-medium">{redemptionStats.completed}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-sm">Pending</span>
            </div>
            <span className="text-sm font-medium">{redemptionStats.pending}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm">Failed</span>
            </div>
            <span className="text-sm font-medium">{redemptionStats.failed}</span>
          </div>
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm">Value Redeemed</span>
              <span className="text-sm font-medium">{formatCurrency(redemptionStats.totalValueRedeemed)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Stats */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Users
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Total Users</span>
            <span className="text-sm font-medium">{userStats.total}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">New (24h)</span>
            <span className="text-sm">{userStats.last24h}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">New (7d)</span>
            <span className="text-sm">{userStats.last7d}</span>
          </div>
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm">User Balances</span>
              <span className="text-sm font-medium">{formatCurrency(userStats.totalBalances)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Deposits */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            User Funds
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Total Deposited</span>
            <span className="text-sm font-medium text-green-500">{formatCurrency(userStats.totalDeposited)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Total Spent</span>
            <span className="text-sm font-medium">{formatCurrency(userStats.totalSpent)}</span>
          </div>
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm">Net Balance</span>
              <span className="text-sm font-medium">{formatCurrency(userStats.totalBalances)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
