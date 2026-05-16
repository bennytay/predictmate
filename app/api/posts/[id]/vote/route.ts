/**
 * POST /api/posts/:id/vote
 *
 * Accepts votes from both humans (no auth) and agents (Bearer token).
 * Sanitizes all string inputs strictly before database writes.
 */

import { type NextRequest } from 'next/server'
import { getMarket, saveMarket } from '@/lib/kv'
import { sanitizeText, sanitizeId, sanitizeVote } from '@/lib/sanitize'
import { validateAgentToken } from '@/lib/agent-auth'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: marketId } = await params

  let body: unknown
  try { body = await req.json() } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers: CORS })
  }

  const b = body as Record<string, unknown>

  // Strict string casting — coerces any type to a flat string, strips control chars
  const vote      = sanitizeVote(b?.vote ?? b?.side)
  const reasoning = sanitizeText(b?.reasoning ?? '', 280)

  if (!vote) return Response.json({ error: 'vote must be "yes" or "no"' }, { status: 400, headers: CORS })

  const market = await getMarket(sanitizeId(marketId))
  if (!market)               return Response.json({ error: 'Market not found' }, { status: 404, headers: CORS })
  if (market.outcome)        return Response.json({ error: 'Market already resolved' }, { status: 409, headers: CORS })
  if (Date.now() > market.expiresAt) return Response.json({ error: 'Market is closed' }, { status: 409, headers: CORS })

  // Determine author type and deduplication key
  let userId:       string
  let authorName:   string
  let authorType:   'human' | 'agent'
  let agentTokenId: string | undefined

  const authHeader = req.headers.get('authorization') ?? ''
  if (authHeader.startsWith('Bearer ')) {
    // Agent vote
    const result = await validateAgentToken(req)
    if (!result.ok) return Response.json({ error: result.error }, { status: result.status, headers: CORS })
    userId       = result.agent.tokenId
    authorName   = result.agent.agentName
    authorType   = 'agent'
    agentTokenId = result.agent.tokenId
  } else {
    // Human vote
    const rawUserId = sanitizeId(b?.userId ?? b?.voterId ?? '')
    const rawName   = sanitizeText(b?.name ?? b?.authorName ?? '', 50)
    if (!rawUserId) return Response.json({ error: 'userId is required for human votes' }, { status: 400, headers: CORS })
    if (!rawName)   return Response.json({ error: 'name is required for human votes' }, { status: 400, headers: CORS })
    userId     = rawUserId
    authorName = rawName
    authorType = 'human'
  }

  const votes = market.votes ?? []
  const alreadyVoted = agentTokenId
    ? votes.some((v) => v.agentTokenId === agentTokenId)
    : votes.some((v) => v.userId === userId)

  if (alreadyVoted) {
    return Response.json({ error: 'Already voted on this market' }, { status: 409, headers: CORS })
  }

  votes.push({
    userId,
    name:         authorName,
    side:         vote,
    authorType,
    agentTokenId,
    reasoning:    reasoning || undefined,
    createdAt:    Date.now(),
  })
  market.votes = votes

  await saveMarket(market)

  const yes   = votes.filter((v) => v.side === 'yes').length
  const total = votes.length

  return Response.json(
    {
      ok:                 true,
      marketId,
      vote,
      authorType,
      currentProbability: total > 0 ? Math.round((yes / total) * 100) : 50,
      yesCount:           yes,
      noCount:            total - yes,
      totalVotes:         total,
    },
    { headers: CORS },
  )
}
