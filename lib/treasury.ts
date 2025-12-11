// Treasury wallet management and transaction signing
// IMPORTANT: Private key is stored ONLY in env vars, never in DB
// Supports EVM chains (Ethereum, BSC, Polygon, etc.) and can be extended

import { ethers } from "ethers"
import { getCoinUsdPrice } from "./coingecko"

// EVM Chain RPC URLs - extend as needed
const EVM_RPCS: Record<string, string[]> = {
  ethereum: ["https://eth.llamarpc.com", "https://rpc.ankr.com/eth"],
  bsc: ["https://bsc-dataseed.binance.org", "https://bsc-dataseed1.binance.org", "https://rpc.ankr.com/bsc"],
  polygon: ["https://polygon-rpc.com", "https://rpc.ankr.com/polygon"],
  arbitrum: ["https://arb1.arbitrum.io/rpc", "https://rpc.ankr.com/arbitrum"],
  optimism: ["https://mainnet.optimism.io", "https://rpc.ankr.com/optimism"],
  avalanche: ["https://api.avax.network/ext/bc/C/rpc"],
  base: ["https://mainnet.base.org", "https://rpc.ankr.com/base"],
  monad: [
    "https://rpc.monad.xyz",
    "https://rpc1.monad.xyz",
    "https://rpc2.monad.xyz",
    "https://rpc3.monad.xyz",
    "https://rpc4.monad.xyz",
    "https://rpc-mainnet.monadinfra.com",
    "https://monad-mainnet.drpc.org",
  ],
}

// Common ERC20 ABI for token transfers
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
]

// Token contract addresses for common stablecoins
const TOKEN_CONTRACTS: Record<string, Record<string, string>> = {
  usdt: {
    ethereum: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    bsc: "0x55d398326f99059fF775485246999027B3197955", // BSC-USD (USDT on BSC)
    polygon: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    arbitrum: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    optimism: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
    avalanche: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
    base: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
  },
  usdc: {
    ethereum: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    bsc: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // USDC on BSC
    polygon: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    arbitrum: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    optimism: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    avalanche: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
  dai: {
    ethereum: "0x6B175474E89094C44Da98b954EescdeCB5e7816C6DA",
    bsc: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3",
    polygon: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    arbitrum: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    optimism: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
  },
  busd: {
    bsc: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
  },
}

const NATIVE_TOKEN_IDS: Record<string, string> = {
  ethereum: "eth",
  bsc: "bnb",
  polygon: "matic",
  arbitrum: "eth",
  optimism: "eth",
  avalanche: "avax",
  base: "eth",
  monad: "mon",
}

const NATIVE_TOKEN_SYMBOLS: Record<string, string> = {
  ethereum: "eth",
  bsc: "bnb",
  polygon: "matic",
  arbitrum: "eth",
  optimism: "eth",
  avalanche: "avax",
  base: "eth",
  monad: "mon",
}

export interface TreasurySendResult {
  success: boolean
  txHash?: string
  error?: string
  gasUsed?: string
  networkFee?: string
}

export interface TreasuryBalance {
  balance: string
  balanceUsd: number
  token: string
  network: string
}

/**
 * Get the treasury wallet private key from environment
 * NEVER log or expose this
 */
function getTreasuryPrivateKey(): string | null {
  return process.env.TREASURY_PRIVATE_KEY || null
}

/**
 * Get RPC provider for a network with fallback support
 */
async function getProvider(network: string): Promise<ethers.JsonRpcProvider | null> {
  if (!network) {
    console.error(`[Treasury] Network is undefined or null`)
    return null
  }

  const rpcUrls = EVM_RPCS[network.toLowerCase()]
  if (!rpcUrls || rpcUrls.length === 0) {
    console.error(`[Treasury] No RPC configured for network: ${network}`)
    return null
  }

  // Try each RPC until one works
  for (const rpcUrl of rpcUrls) {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl)
      // Test the connection with a simple call
      await provider.getBlockNumber()
      return provider
    } catch (error) {
      console.warn(`[Treasury] RPC ${rpcUrl} failed, trying next...`)
      continue
    }
  }

  console.error(`[Treasury] All RPCs failed for network: ${network}`)
  return null
}

/**
 * Get token contract address
 */
function getTokenContract(token: string, network: string): string | null {
  if (!token || !network) {
    console.error(`[Treasury] Token or network is undefined - token: ${token}, network: ${network}`)
    return null
  }

  const tokenLower = token.toLowerCase()
  const networkLower = network.toLowerCase()
  return TOKEN_CONTRACTS[tokenLower]?.[networkLower] || null
}

/**
 * Check if token is a stablecoin (maps to a contract address)
 */
function isStablecoin(token: string): boolean {
  if (!token) return false
  const tokenLower = token.toLowerCase()
  return ["usdt", "usdc", "dai", "busd"].includes(tokenLower)
}

/**
 * Check if network is EVM compatible
 */
export function isEVMNetwork(network: string): boolean {
  if (!network) return false
  return Object.keys(EVM_RPCS).includes(network.toLowerCase())
}

/**
 * Check if we can auto-send on this network
 */
export function canAutoSend(network: string): boolean {
  return isEVMNetwork(network)
}

/**
 * Get native token symbol for a network
 */
export function getNativeTokenSymbol(network: string): string {
  if (!network) return "eth"
  return NATIVE_TOKEN_SYMBOLS[network.toLowerCase()] || "eth"
}

/**
 * Get treasury wallet balance for a specific token
 */
export async function getTreasuryBalance(
  walletAddress: string,
  token: string,
  network: string,
): Promise<TreasuryBalance | null> {
  try {
    if (!walletAddress) {
      console.error(`[Treasury] walletAddress is undefined or null`)
      return null
    }
    if (!token) {
      console.error(`[Treasury] token is undefined or null`)
      return null
    }
    if (!network) {
      console.error(`[Treasury] network is undefined or null`)
      return null
    }

    const networkLower = network.toLowerCase()
    const tokenLower = token.toLowerCase()

    if (!isEVMNetwork(networkLower)) {
      console.log(`[Treasury] Non-EVM network ${networkLower}, balance check not implemented`)
      return null
    }

    const provider = await getProvider(networkLower)
    if (!provider) {
      console.error(`[Treasury] Could not connect to ${networkLower} RPC`)
      return null
    }

    const tokenAddress = getTokenContract(tokenLower, networkLower)

    if (tokenAddress) {
      // ERC20 token balance (USDT, USDC, etc.)
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
      const balance = await contract.balanceOf(walletAddress)
      const decimals = await contract.decimals()
      const balanceFormatted = ethers.formatUnits(balance, decimals)

      // For stablecoins, assume $1 per token
      return {
        balance: balanceFormatted,
        balanceUsd: Number.parseFloat(balanceFormatted),
        token: tokenLower.toUpperCase(),
        network: networkLower,
      }
    } else {
      // Native token balance (ETH, BNB, MON, etc.)
      const balance = await provider.getBalance(walletAddress)
      const balanceFormatted = ethers.formatEther(balance)
      const balanceNum = Number.parseFloat(balanceFormatted)

      let balanceUsd = balanceNum
      const nativeSymbol = NATIVE_TOKEN_SYMBOLS[networkLower] || tokenLower
      const price = await getCoinUsdPrice(nativeSymbol)
      if (price && price > 0) {
        balanceUsd = balanceNum * price
        console.log(`[Treasury] ${nativeSymbol} balance: ${balanceFormatted}, price: $${price}, USD: $${balanceUsd}`)
      } else {
        console.warn(`[Treasury] Could not get price for ${nativeSymbol}, using balance as USD (may be inaccurate)`)
      }

      return {
        balance: balanceFormatted,
        balanceUsd,
        token: tokenLower.toUpperCase(),
        network: networkLower,
      }
    }
  } catch (error) {
    console.error(`[Treasury] Balance check failed for ${network}:`, error)
    return null
  }
}

/**
 * Send tokens from treasury wallet to a destination address
 * This is used for redemptions - sending to SideShift deposit address
 */
export async function sendFromTreasury(
  token: string,
  network: string,
  toAddress: string,
  amount: string,
): Promise<TreasurySendResult> {
  try {
    if (!token || !network || !toAddress || !amount) {
      return {
        success: false,
        error: `Missing parameters - token: ${token}, network: ${network}, to: ${toAddress}, amount: ${amount}`,
      }
    }

    const privateKey = getTreasuryPrivateKey()
    if (!privateKey) {
      return {
        success: false,
        error: "Treasury private key not configured. Set TREASURY_PRIVATE_KEY in environment variables.",
      }
    }

    // For non-EVM networks, we need manual processing
    if (!isEVMNetwork(network)) {
      return {
        success: false,
        error: `Automatic sending not supported for ${network}. Manual processing required.`,
      }
    }

    const provider = await getProvider(network)
    if (!provider) {
      return {
        success: false,
        error: `Could not connect to ${network} network. Please try again.`,
      }
    }

    const wallet = new ethers.Wallet(privateKey, provider)
    const tokenAddress = getTokenContract(token, network)

    let tx: ethers.TransactionResponse

    if (tokenAddress) {
      // ERC20 token transfer (USDT, USDC on BSC, etc.)
      console.log(`[Treasury] Sending ${amount} ${token} (ERC20) on ${network} to ${toAddress}`)
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet)
      const decimals = await contract.decimals()
      const amountInWei = ethers.parseUnits(amount, decimals)

      tx = await contract.transfer(toAddress, amountInWei)
    } else {
      // Native token transfer (ETH, BNB, MON, etc.)
      console.log(`[Treasury] Sending ${amount} ${token} (native) on ${network} to ${toAddress}`)
      const amountInWei = ethers.parseEther(amount)

      tx = await wallet.sendTransaction({
        to: toAddress,
        value: amountInWei,
      })
    }

    // Wait for confirmation
    const receipt = await tx.wait()

    if (!receipt) {
      return {
        success: false,
        error: "Transaction submitted but receipt not received",
        txHash: tx.hash,
      }
    }

    console.log(`[Treasury] Transaction successful: ${tx.hash}`)
    return {
      success: true,
      txHash: tx.hash,
      gasUsed: receipt.gasUsed.toString(),
      networkFee: ethers.formatEther(receipt.gasUsed * (receipt.gasPrice || 0n)),
    }
  } catch (error) {
    console.error(`[Treasury] Send failed:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during transfer",
    }
  }
}
