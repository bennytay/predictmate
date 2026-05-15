import { type NextRequest } from 'next/server'
import { nanoid } from 'nanoid'
import { saveMarket } from '@/lib/kv'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { question, creatorName, expiresAt } = body

  if (!question?.trim() || !creatorName?.trim() || !expiresAt) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const expiry = new Date(expiresAt).getTime()
  if (isNaN(expiry) || expiry <= Date.now()) {
    return Response.json({ error: 'Expiry must be in the future' }, { status: 400 })
  }

  const id = nanoid(8)
  await saveMarket({
    id,
    question: question.trim(),
    creatorName: creatorName.trim(),
    expiresAt: expiry,
    yesPool: 0,
    noPool: 0,
    bets: [],
  })

  return Response.json({ id })
}
