import { Redis } from '@upstash/redis'

const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export type Bet = {
  id: string
  name: string
  side: 'yes' | 'no'
  amount: number
  createdAt: number
}

export type Market = {
  id: string
  question: string
  creatorName: string
  expiresAt: number
  yesPool: number
  noPool: number
  bets: Bet[]
  outcome?: 'yes' | 'no'
  resolvedAt?: number
}

export async function getMarket(id: string): Promise<Market | null> {
  return kv.get<Market>(`market:${id}`)
}

export async function saveMarket(market: Market): Promise<void> {
  await kv.set(`market:${market.id}`, market)
}

export function yesOdds(market: Market): number {
  const total = market.yesPool + market.noPool
  return total > 0 ? Math.round((market.yesPool / total) * 100) : 50
}

export type Expense = {
  id: string
  payer: string
  description: string
  amount: number
  createdAt: number
}

export type Payback = {
  id: string
  from: string
  to: string
  amount: number
  note: string
  createdAt: number
}

export type SplitGroup = {
  id: string
  title: string
  expenses: Expense[]
  paybacks: Payback[]
  createdAt: number
}

export async function getSplitGroup(id: string): Promise<SplitGroup | null> {
  return kv.get<SplitGroup>(`split:${id}`)
}

export async function saveSplitGroup(group: SplitGroup): Promise<void> {
  await kv.set(`split:${group.id}`, group)
}
