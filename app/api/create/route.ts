import { type NextRequest } from 'next/server'
import { nanoid } from 'nanoid'
import { saveMarket, addMarketToIndex } from '@/lib/kv'

export async function POST(req: NextRequest) {
  const { question, creatorName, expiresAt, context, imageUrl } = await req.json()

  if (!question?.trim() || !creatorName?.trim() || !expiresAt) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const expiry = new Date(expiresAt).getTime()
  if (isNaN(expiry) || expiry <= Date.now()) {
    return Response.json({ error: 'Expiry must be in the future' }, { status: 400 })
  }

  const market = {
    id: nanoid(8),
    question: question.trim().slice(0, 280),
    creatorName: creatorName.trim().slice(0, 50),
    context: context?.trim().slice(0, 1000) || undefined,
    imageUrl: imageUrl?.trim() || undefined,
    expiresAt: expiry,
    votes: [],
    upvoters: [],
    downvoters: [],
    createdAt: Date.now(),
  }

  await saveMarket(market)
  await addMarketToIndex(market.id)

  return Response.json({ id: market.id })
}
