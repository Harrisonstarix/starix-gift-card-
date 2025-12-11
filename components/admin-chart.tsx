"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, Loader2 } from "lucide-react"

interface ChartData {
  date: string
  purchases: number
  purchaseValue: number
  redemptions: number
  redemptionValue: number
  fees: number
}

interface StatusBreakdown {
  pending: number
  active: number
  redeemed: number
  expired: number
  cancelled: number
}

interface ValueByStatus {
  pending: number
  active: number
  redeemed: number
  expired: number
}

export function AdminChart() {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown | null>(null)
  const [valueByStatus, setValueByStatus] = useState<ValueByStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartType, setChartType] = useState<"volume" | "count" | "fees">("volume")

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const res = await fetch("/api/admin/stats/chart-data")
        if (res.ok) {
          const data = await res.json()
          setChartData(data.chartData || [])
          setStatusBreakdown(data.statusBreakdown)
          setValueByStatus(data.valueByStatus)
        }
      } catch (err) {
        console.error("Failed to fetch chart data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchChartData()
  }, [])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
    return `$${value.toFixed(0)}`
  }

  // Calculate totals
  const totalPurchaseValue = chartData.reduce((sum, d) => sum + d.purchaseValue, 0)
  const totalRedemptionValue = chartData.reduce((sum, d) => sum + d.redemptionValue, 0)
  const totalFees = chartData.reduce((sum, d) => sum + d.fees, 0)
  const totalPurchases = chartData.reduce((sum, d) => sum + d.purchases, 0)

  const pieData = statusBreakdown
    ? [
        { name: "Active", value: statusBreakdown.active, color: "#22c55e" },
        { name: "Pending", value: statusBreakdown.pending, color: "#eab308" },
        { name: "Redeemed", value: statusBreakdown.redeemed, color: "#3b82f6" },
        { name: "Expired", value: statusBreakdown.expired, color: "#ef4444" },
        { name: "Cancelled", value: statusBreakdown.cancelled, color: "#6b7280" },
      ].filter((item) => item.value > 0)
    : []

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Main Chart */}
      <Card className="bg-card border-border lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Activity Overview
              </CardTitle>
              <CardDescription>Last 30 days performance</CardDescription>
            </div>
            <Tabs value={chartType} onValueChange={(v) => setChartType(v as typeof chartType)}>
              <TabsList className="grid grid-cols-3 w-auto">
                <TabsTrigger value="volume" className="text-xs px-3">
                  Volume
                </TabsTrigger>
                <TabsTrigger value="count" className="text-xs px-3">
                  Count
                </TabsTrigger>
                <TabsTrigger value="fees" className="text-xs px-3">
                  Fees
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-muted-foreground">
                {chartType === "volume"
                  ? `Purchases: ${formatCurrency(totalPurchaseValue)}`
                  : `Purchases: ${totalPurchases}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-muted-foreground">
                {chartType === "volume"
                  ? `Redemptions: ${formatCurrency(totalRedemptionValue)}`
                  : `Redemptions: ${chartData.reduce((sum, d) => sum + d.redemptions, 0)}`}
              </span>
            </div>
            {chartType === "fees" && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm text-muted-foreground">Total Fees: {formatCurrency(totalFees)}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            {chartType === "fees" ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickFormatter={formatDate} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis tickFormatter={formatCurrency} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelFormatter={formatDate}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Fees"]}
                />
                <Bar dataKey="fees" fill="#eab308" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickFormatter={formatDate} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis
                  tickFormatter={chartType === "volume" ? formatCurrency : undefined}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelFormatter={formatDate}
                  formatter={(value: number, name: string) => [
                    chartType === "volume" ? `$${value.toFixed(2)}` : value,
                    name === "purchaseValue" || name === "purchases" ? "Purchases" : "Redemptions",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey={chartType === "volume" ? "purchaseValue" : "purchases"}
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey={chartType === "volume" ? "redemptionValue" : "redemptions"}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status Pie Chart */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Card Status</CardTitle>
          <CardDescription>Distribution of gift cards</CardDescription>
        </CardHeader>
        <CardContent>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {item.value}
                    </Badge>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">No data yet</div>
          )}

          {/* Value breakdown */}
          {valueByStatus && (
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">Value by Status</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-500">Active</span>
                <span>${valueByStatus.active.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-500">Redeemed</span>
                <span>${valueByStatus.redeemed.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-yellow-500">Pending</span>
                <span>${valueByStatus.pending.toFixed(2)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
