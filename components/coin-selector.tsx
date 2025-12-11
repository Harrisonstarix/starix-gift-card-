"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, ChevronDown, Loader2, AlertTriangle, Info } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export interface CoinOption {
  id: string
  name: string
  symbol: string
  network: string
  networkName: string
  icon: string
  hasMemo: boolean
  isTreasury: boolean
  canDeposit: boolean
  canSettle: boolean
}

interface CoinSelectorProps {
  value: CoinOption | null
  onChange: (coin: CoinOption | null) => void
  mode: "deposit" | "settle" // deposit = user paying, settle = user receiving
  label?: string
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function CoinSelector({
  value,
  onChange,
  mode,
  label = "Select Cryptocurrency",
  placeholder = "Choose a coin...",
  disabled = false,
  className,
}: CoinSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [coins, setCoins] = useState<CoinOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch coins on mount
  useEffect(() => {
    const fetchCoins = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          excludeTreasury: "true",
          ...(mode === "deposit" ? { forDeposit: "true" } : { forSettle: "true" }),
        })
        const res = await fetch(`/api/sideshift/coins?${params}`)
        if (!res.ok) throw new Error("Failed to fetch coins")
        const data = await res.json()
        setCoins(data.coins || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load coins")
      } finally {
        setLoading(false)
      }
    }
    fetchCoins()
  }, [mode])

  // Filter coins by search
  const filteredCoins = useMemo(() => {
    if (!search) return coins
    const s = search.toLowerCase()
    return coins.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.symbol.toLowerCase().includes(s) ||
        c.network.toLowerCase().includes(s) ||
        c.networkName.toLowerCase().includes(s),
    )
  }, [coins, search])

  // Group coins by symbol for display
  const groupedCoins = useMemo(() => {
    const groups: Record<string, CoinOption[]> = {}
    for (const coin of filteredCoins) {
      if (!groups[coin.symbol]) groups[coin.symbol] = []
      groups[coin.symbol].push(coin)
    }
    return groups
  }, [filteredCoins])

  const handleSelect = (coin: CoinOption) => {
    onChange(coin)
    setOpen(false)
    setSearch("")
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-14 justify-between px-4 bg-transparent"
            disabled={disabled || loading}
          >
            {loading ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading coins...
              </span>
            ) : value ? (
              <div className="flex items-center gap-3">
                <Image
                  src={value.icon || "/placeholder.svg"}
                  alt={value.name}
                  width={28}
                  height={28}
                  className="rounded-full"
                  onError={(e) => {
                    e.currentTarget.src = "/crypto-digital-landscape.png"
                  }}
                />
                <div className="text-left">
                  <div className="font-medium">{value.symbol}</div>
                  <div className="text-xs text-muted-foreground">{value.networkName}</div>
                </div>
                {value.hasMemo && (
                  <Badge variant="outline" className="text-xs">
                    Memo required
                  </Badge>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Cryptocurrency</DialogTitle>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, symbol, or network..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {error ? (
            <div className="flex items-center gap-2 p-4 text-sm text-destructive">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-1">
                {Object.entries(groupedCoins).map(([symbol, coinGroup]) => (
                  <div key={symbol}>
                    {coinGroup.map((coin) => (
                      <button
                        key={`${coin.id}-${coin.network}`}
                        onClick={() => handleSelect(coin)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                          value?.id === coin.id && value?.network === coin.network
                            ? "bg-primary/10 border border-primary"
                            : "hover:bg-muted",
                        )}
                      >
                        <Image
                          src={coin.icon || "/placeholder.svg"}
                          alt={coin.name}
                          width={36}
                          height={36}
                          className="rounded-full"
                          onError={(e) => {
                            e.currentTarget.src = "/crypto-digital-landscape.png"
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{coin.symbol}</span>
                            <span className="text-sm text-muted-foreground truncate">{coin.name}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">{coin.networkName}</div>
                        </div>
                        {coin.hasMemo && (
                          <Badge variant="secondary" className="text-xs flex-shrink-0">
                            <Info className="w-3 h-3 mr-1" />
                            Memo
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
                {filteredCoins.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No coins found matching "{search}"</div>
                )}
              </div>
            </ScrollArea>
          )}

          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            {coins.length} cryptocurrencies available on 40+ networks
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
