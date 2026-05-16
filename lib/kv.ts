import { Redis } from '@upstash/redis'

const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export type Vote = {
  userId: string
  name: string
  side: 'yes' | 'no'
  createdAt: number
}

export type Market = {
  id: string
  question: string
  creatorName: string
  context?: string
  imageUrl?: string
  expiresAt: number
  votes: Vote[]
  upvoters: string[]
  downvoters: string[]
  outcome?: 'yes' | 'no'
  resolvedAt?: number
  createdAt: number
}

export async function getMarket(id: string): Promise<Market | null> {
  return kv.get<Market>(`market:${id}`)
}

export async function saveMarket(market: Market): Promise<void> {
  await kv.set(`market:${market.id}`, market)
}

export async function addMarketToIndex(id: string): Promise<void> {
  await kv.lpush('markets:index', id)
}

export async function getMarketIndex(limit = 50): Promise<string[]> {
  return kv.lrange<string>('markets:index', 0, limit - 1)
}

export function yesCount(m: Market): number {
  return (m.votes ?? []).filter((v) => v.side === 'yes').length
}

export function noCount(m: Market): number {
  return (m.votes ?? []).filter((v) => v.side === 'no').length
}

export function yesOdds(m: Market): number {
  const total = (m.votes ?? []).length
  return total > 0 ? Math.round((yesCount(m) / total) * 100) : 50
}
