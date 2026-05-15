import { type NextRequest } from 'next/server'
import { getMarket, saveMarket } from '@/lib/kv'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { marketId, outcome, creatorName } = body

  if (!marketId || !outcome || !creatorName) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (outcome !== 'yes' && outcome !== 'no') {
    return Response.json({ error: 'Outcome must be yes or no' }, { status: 400 })
  }

  const market = await getMarket(marketId)
  if (!market) return Response.json({ error: 'Market not found' }, { status: 404 })
  if (market.outcome) return Response.json({ error: 'Market already settled' }, { status: 400 })
  if (market.creatorName.toLowerCase() !== creatorName.trim().toLowerCase()) {
    return Response.json({ error: 'Only the creator can settle this market' }, { status: 403 })
  }

  market.outcome = outcome
  market.resolvedAt = Date.now()
  await saveMarket(market)

  return Response.json({ ok: true })
}
