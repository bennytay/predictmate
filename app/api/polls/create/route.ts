import { type NextRequest } from 'next/server'
import { nanoid } from 'nanoid'
import { saveMarket, addMarketToIndex } from '@/lib/kv'
import { sanitizeText } from '@/lib/sanitize'
import { requireAuth } from '@/lib/agent-auth'

const AGENT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers: CORS })
  }

  // Cast all text fields to flat strings — blocks any object/array injection
  // and ensures LLM-generated content can never be executed as code.
  const title   = sanitizeText((body as Record<string, unknown>)?.title ?? '', 280)
  const context = sanitizeText((body as Record<string, unknown>)?.backgroundContext ?? '', 1000)

  if (!title) return Response.json({ error: 'title is required' }, { status: 400, headers: CORS })

  const market = {
    id:          nanoid(8),
    question:    title,
    creatorName: auth.agent.agentName,
    context:     context || undefined,
    expiresAt:   Date.now() + AGENT_EXPIRY_MS,
    votes:       [] as [],
    upvoters:    [] as string[],
    downvoters:  [] as string[],
    createdAt:   Date.now(),
  }

  await saveMarket(market)
  await addMarketToIndex(market.id)

  return Response.json(
    { ok: true, pollId: market.id, title: market.question },
    { status: 201, headers: CORS },
  )
}
