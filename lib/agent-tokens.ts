import { randomBytes, createHash } from 'node:crypto'
import { kv } from './kv'

export interface AgentToken {
  id: string           // UUID — used in API endpoints
  ownerId: string      // browser-generated owner UUID
  agentName: string
  tokenHash: string    // SHA-256 of the raw token
  tokenPrefix: string  // first 14 chars of the raw token (for masked display)
  tokenSuffix: string  // last 4 chars of the raw token (for masked display)
  lastUsedAt: number | null
  createdAt: number
  isRevoked: boolean
}

// Redis key helpers
const tokenKey   = (id: string)   => `agent_token:${id}`
const hashKey    = (hash: string) => `agent_token_hash:${hash}`
const ownerKey   = (ownerId: string) => `agent_tokens:${ownerId}`
const rateKey    = (id: string, win: number) => `ratelimit:${id}:${win}`

const RATE_LIMIT = 60   // requests per minute
const RATE_WINDOW = 60_000

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

export function generateRawToken(): string {
  return 'pm_live_' + randomBytes(24).toString('base64url')
}

export async function createAgentToken(
  ownerId: string,
  agentName: string,
): Promise<{ record: AgentToken; rawToken: string }> {
  const rawToken = generateRawToken()
  const id = crypto.randomUUID()
  const now = Date.now()

  const record: AgentToken = {
    id,
    ownerId,
    agentName: agentName.trim().slice(0, 80) || 'Unnamed Agent',
    tokenHash: hashToken(rawToken),
    tokenPrefix: rawToken.slice(0, 14),
    tokenSuffix: rawToken.slice(-4),
    lastUsedAt: null,
    createdAt: now,
    isRevoked: false,
  }

  await kv.set(tokenKey(id), record)
  await kv.set(hashKey(record.tokenHash), id)
  await kv.lpush(ownerKey(ownerId), id)

  return { record, rawToken }
}

export async function lookupToken(rawToken: string): Promise<AgentToken | null> {
  const hash = hashToken(rawToken)
  const id = await kv.get<string>(hashKey(hash))
  if (!id) return null

  const record = await kv.get<AgentToken>(tokenKey(id))
  if (!record || record.isRevoked) return null

  // Fire-and-forget lastUsedAt update
  record.lastUsedAt = Date.now()
  void kv.set(tokenKey(id), record)

  return record
}

export async function getTokensByOwner(ownerId: string): Promise<AgentToken[]> {
  const ids = await kv.lrange<string>(ownerKey(ownerId), 0, -1)
  if (!ids.length) return []
  const records = await Promise.all(ids.map((id) => kv.get<AgentToken>(tokenKey(id))))
  return (records.filter((r) => r !== null && !r.isRevoked) as AgentToken[]).sort(
    (a, b) => b.createdAt - a.createdAt,
  )
}

export async function revokeToken(id: string, ownerId: string): Promise<boolean> {
  const record = await kv.get<AgentToken>(tokenKey(id))
  if (!record || record.ownerId !== ownerId) return false

  record.isRevoked = true
  await kv.set(tokenKey(id), record)
  await kv.del(hashKey(record.tokenHash))

  return true
}

export async function checkRateLimit(
  tokenId: string,
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const win = Math.floor(Date.now() / RATE_WINDOW)
  const key = rateKey(tokenId, win)
  const count = await kv.incr(key)
  if (count === 1) await kv.expire(key, Math.ceil(RATE_WINDOW / 1000) + 30)
  const remaining = Math.max(0, RATE_LIMIT - count)
  return { allowed: count <= RATE_LIMIT, remaining, limit: RATE_LIMIT }
}
