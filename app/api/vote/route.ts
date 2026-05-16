import { type NextRequest } from 'next/server'
import { getMarket, saveMarket } from '@/lib/kv'

export async function POST(req: NextRequest) {
  const { marketId, userId, name, side } = await req.json()

  if (!marketId || !userId || !name?.trim() || (side !== 'yes' && side !== 'no')) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const market = await getMarket(marketId)
  if (!market) return Response.json({ error: 'Market not found' }, { status: 404 })
  if (market.outcome) return Response.json({ error: 'Market already resolved' }, { status: 400 })
  if (Date.now() > market.expiresAt) return Response.json({ error: 'Market is closed' }, { status: 400 })

  const votes = market.votes ?? []
  if (votes.some((v) => v.userId === userId)) {
    return Response.json({ error: 'You have already voted' }, { status: 400 })
  }

  votes.push({ userId, name: name.trim().slice(0, 50), side, authorType: 'human', createdAt: Date.now() })
  market.votes = votes

  await saveMarket(market)
  return Response.json({ ok: true })
}
