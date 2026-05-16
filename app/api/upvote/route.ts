import { type NextRequest } from 'next/server'
import { getMarket, saveMarket } from '@/lib/kv'

export async function POST(req: NextRequest) {
  const { marketId, userId, action } = await req.json()

  if (!marketId || !userId || (action !== 'up' && action !== 'down')) {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  const market = await getMarket(marketId)
  if (!market) return Response.json({ error: 'Market not found' }, { status: 404 })

  const upvoters = market.upvoters ?? []
  const downvoters = market.downvoters ?? []

  if (action === 'up') {
    if (upvoters.includes(userId)) {
      market.upvoters = upvoters.filter((id) => id !== userId)
    } else {
      market.upvoters = [...upvoters, userId]
      market.downvoters = downvoters.filter((id) => id !== userId)
    }
  } else {
    if (downvoters.includes(userId)) {
      market.downvoters = downvoters.filter((id) => id !== userId)
    } else {
      market.downvoters = [...downvoters, userId]
      market.upvoters = upvoters.filter((id) => id !== userId)
    }
  }

  await saveMarket(market)
  return Response.json({
    upvotes: market.upvoters.length,
    downvotes: market.downvoters.length,
  })
}
