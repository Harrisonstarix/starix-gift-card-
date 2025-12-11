"use client"

import { useMemo } from "react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ChartData {
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

interface StatusBreakdown {
  deposits: { pending: number; completed: number; failed: number }
  giftCards: { pending: number; active: number; redeemed: number; expired: number }
  redemptions: { pending: number; processing: number; completed: number; failed: number }
}

interface AdminChartsProps {
  chartData: ChartData[]
  statusBreakdown: StatusBreakdown
  totals: {
    deposits: number
    depositVolume: number
    purchases: number
    purchaseVolume: number
    redemptions: number
    redemptionVolume: number
    fees: number
    users: number
  }
  period: string
}

const COLORS = {
  deposits: "#10b981",
  purchases: "#3b82f6",
  redemptions: "#8b5cf6",
  fees: "#f59e0b",
  users: "#ec4899",
  pending: "#eab308",
  completed: "#22c55e",
  active: "#3b82f6",
  redeemed: "#8b5cf6",
  failed: "#ef4444",
  expired: "#6b7280",
  processing: "#06b6d4",
}

export function VolumeChart({ data, period }: { data: ChartData[]; period: string }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Volume Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="depositGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.deposits} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.deposits} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="purchaseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.purchases} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.purchases} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="redemptionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.redemptions} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.redemptions} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="label" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#666"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, ""]}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="depositVolume"
                name="Deposits"
                stroke={COLORS.deposits}
                fill="url(#depositGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="purchaseVolume"
                name="Purchases"
                stroke={COLORS.purchases}
                fill="url(#purchaseGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="redemptionVolume"
                name="Redemptions"
                stroke={COLORS.redemptions}
                fill="url(#redemptionGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function TransactionsChart({ data }: { data: ChartData[] }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Transactions Count</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="label" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend />
              <Bar dataKey="deposits" name="Deposits" fill={COLORS.deposits} radius={[4, 4, 0, 0]} />
              <Bar dataKey="purchases" name="Purchases" fill={COLORS.purchases} radius={[4, 4, 0, 0]} />
              <Bar dataKey="redemptions" name="Redemptions" fill={COLORS.redemptions} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function FeesChart({ data }: { data: ChartData[] }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Fees Collected</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="label" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#666"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, "Fees"]}
              />
              <Line type="monotone" dataKey="fees" stroke={COLORS.fees} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function UsersChart({ data }: { data: ChartData[] }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">New Users</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="label" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="users" name="New Users" fill={COLORS.users} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function StatusPieChart({
  title,
  data,
}: {
  title: string
  data: { name: string; value: number; color: string }[]
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  if (total === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[150px] flex items-center justify-center text-muted-foreground text-sm">
            No data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string) => [value, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {data.map((entry, index) => (
            <div key={index} className="flex items-center gap-1 text-xs">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">
                {entry.name}: {entry.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function AdminChartsDashboard({ chartData, statusBreakdown, totals, period }: AdminChartsProps) {
  const depositStatusData = useMemo(
    () => [
      { name: "Completed", value: statusBreakdown.deposits.completed, color: COLORS.completed },
      { name: "Pending", value: statusBreakdown.deposits.pending, color: COLORS.pending },
      { name: "Failed", value: statusBreakdown.deposits.failed, color: COLORS.failed },
    ],
    [statusBreakdown.deposits],
  )

  const cardStatusData = useMemo(
    () => [
      { name: "Active", value: statusBreakdown.giftCards.active, color: COLORS.active },
      { name: "Redeemed", value: statusBreakdown.giftCards.redeemed, color: COLORS.redeemed },
      { name: "Pending", value: statusBreakdown.giftCards.pending, color: COLORS.pending },
      { name: "Expired", value: statusBreakdown.giftCards.expired, color: COLORS.expired },
    ],
    [statusBreakdown.giftCards],
  )

  const redemptionStatusData = useMemo(
    () => [
      { name: "Completed", value: statusBreakdown.redemptions.completed, color: COLORS.completed },
      { name: "Processing", value: statusBreakdown.redemptions.processing, color: COLORS.processing },
      { name: "Pending", value: statusBreakdown.redemptions.pending, color: COLORS.pending },
      { name: "Failed", value: statusBreakdown.redemptions.failed, color: COLORS.failed },
    ],
    [statusBreakdown.redemptions],
  )

  return (
    <div className="space-y-4">
      {/* Volume Chart */}
      <VolumeChart data={chartData} period={period} />

      {/* Transactions and Fees */}
      <div className="grid md:grid-cols-2 gap-4">
        <TransactionsChart data={chartData} />
        <FeesChart data={chartData} />
      </div>

      {/* Status Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusPieChart title="Deposit Status" data={depositStatusData} />
        <StatusPieChart title="Gift Card Status" data={cardStatusData} />
        <StatusPieChart title="Redemption Status" data={redemptionStatusData} />
      </div>

      {/* Users Chart */}
      <UsersChart data={chartData} />
    </div>
  )
}
