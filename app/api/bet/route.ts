import { type NextRequest } from 'next/server'
import { nanoid } from 'nanoid'
import { getMarket, saveMarket } from '@/lib/kv'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { marketId, name, side, amount } = body

  if (!marketId || !name?.trim() || !side || !amount) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (side !== 'yes' && side !== 'no') {
    return Response.json({ error: 'Side must be yes or no' }, { status: 400 })
  }

  const parsedAmount = Number(amount)
  if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > 1_000_000) {
    return Response.json({ error: 'Amount must be between 1 and 1,000,000' }, { status: 400 })
  }

  const market = await getMarket(marketId)
  if (!market) {
    return Response.json({ error: 'Market not found' }, { status: 404 })
  }
  if (Date.now() > market.expiresAt) {
    return Response.json({ error: 'This market has closed' }, { status: 400 })
  }

  const bet = {
    id: nanoid(6),
    name: name.trim(),
    side: side as 'yes' | 'no',
    amount: parsedAmount,
    createdAt: Date.now(),
  }

  market.bets.push(bet)
  if (side === 'yes') market.yesPool += parsedAmount
  else market.noPool += parsedAmount

  await saveMarket(market)
  return Response.json({ bet })
}
