// ============================================================
// ENCRYPTION UTILITIES - AES-256-GCM for private keys
// ============================================================

const ALGORITHM = "AES-GCM"
const KEY_LENGTH = 256

// Get encryption key from environment
function getEncryptionKey(): string {
  const key = process.env.WALLET_ENCRYPTION_KEY
  if (!key) {
    throw new Error("WALLET_ENCRYPTION_KEY environment variable is required")
  }
  if (key.length < 32) {
    throw new Error("WALLET_ENCRYPTION_KEY must be at least 32 characters")
  }
  return key
}

// Convert string to ArrayBuffer
function stringToBuffer(str: string): ArrayBuffer {
  return new TextEncoder().encode(str)
}

// Convert ArrayBuffer to string
function bufferToString(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer)
}

// Convert ArrayBuffer to hex string
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

// Convert hex string to ArrayBuffer
function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.substr(i, 2), 16)
  }
  return bytes.buffer
}

// Derive a crypto key from the encryption key
async function deriveKey(salt: ArrayBuffer): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey("raw", stringToBuffer(getEncryptionKey()), "PBKDF2", false, [
    "deriveKey",
  ])

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"],
  )
}

/**
 * Encrypt a private key using AES-256-GCM
 * Returns encrypted data and IV as hex strings
 */
export async function encryptPrivateKey(privateKey: string): Promise<{ encrypted: string; iv: string }> {
  // Generate random IV (12 bytes for GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12))

  // Generate random salt for key derivation
  const salt = crypto.getRandomValues(new Uint8Array(16))

  // Derive key
  const key = await deriveKey(salt.buffer)

  // Encrypt
  const encrypted = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, stringToBuffer(privateKey))

  // Combine salt + encrypted data
  const combined = new Uint8Array(salt.length + encrypted.byteLength)
  combined.set(salt, 0)
  combined.set(new Uint8Array(encrypted), salt.length)

  return {
    encrypted: bufferToHex(combined.buffer),
    iv: bufferToHex(iv.buffer),
  }
}

/**
 * Decrypt a private key using AES-256-GCM
 */
export async function decryptPrivateKey(encryptedHex: string, ivHex: string): Promise<string> {
  const combined = new Uint8Array(hexToBuffer(encryptedHex))
  const iv = new Uint8Array(hexToBuffer(ivHex))

  // Extract salt (first 16 bytes)
  const salt = combined.slice(0, 16)
  const encrypted = combined.slice(16)

  // Derive key using same salt
  const key = await deriveKey(salt.buffer)

  // Decrypt
  const decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, encrypted)

  return bufferToString(decrypted)
}

/**
 * Hash a password using bcrypt-compatible method
 * Note: In production, use bcrypt library on server-side
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey("raw", stringToBuffer(password), "PBKDF2", false, ["deriveBits"])

  const hash = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    key,
    256,
  )

  // Return salt:hash format
  return `${bufferToHex(salt.buffer)}:${bufferToHex(hash)}`
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(":")
  if (!saltHex || !hashHex) return false

  const salt = hexToBuffer(saltHex)
  const key = await crypto.subtle.importKey("raw", stringToBuffer(password), "PBKDF2", false, ["deriveBits"])

  const hash = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    key,
    256,
  )

  return bufferToHex(hash) === hashHex
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return bufferToHex(bytes.buffer)
}

/**
 * Generate a gift card code in format STARIX-XXXX-XXXX-XXXX
 */
export function generateGiftCardCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Removed confusing chars like 0, O, 1, I
  let code = "STARIX"

  for (let block = 0; block < 3; block++) {
    code += "-"
    for (let i = 0; i < 4; i++) {
      const randomIndex = crypto.getRandomValues(new Uint8Array(1))[0] % chars.length
      code += chars[randomIndex]
    }
  }

  return code
}

/**
 * Generate a secret code for gift card verification (16 random alphanumeric chars)
 */
export function generateSecretCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
  let code = ""

  for (let i = 0; i < 16; i++) {
    const randomIndex = crypto.getRandomValues(new Uint8Array(1))[0] % chars.length
    code += chars[randomIndex]
  }

  return code
}
