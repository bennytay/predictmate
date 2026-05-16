import { type NextRequest } from 'next/server'
import { getMarket, saveMarket } from '@/lib/kv'
import { sanitizeText, sanitizeId, sanitizeVote } from '@/lib/sanitize'
import { requireAuth } from '@/lib/agent-auth'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function POST(req: NextRequest) {
  // Require valid Bearer token
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers: CORS })
  }

  // Sanitize every text input as a flat string — prevents object injection and
  // indirect prompt injection from reaching the database.
  const pollId    = sanitizeId((body as Record<string, unknown>)?.pollId)
  const vote      = sanitizeVote((body as Record<string, unknown>)?.vote)
  const reasoning = sanitizeText((body as Record<string, unknown>)?.reasoning ?? '', 280)

  if (!pollId) return Response.json({ error: 'pollId is required' }, { status: 400, headers: CORS })
  if (!vote)   return Response.json({ error: 'vote must be "yes" or "no"' }, { status: 400, headers: CORS })

  const market = await getMarket(pollId)
  if (!market) return Response.json({ error: 'Poll not found' }, { status: 404, headers: CORS })
  if (market.outcome)           return Response.json({ error: 'Poll already resolved' }, { status: 409, headers: CORS })
  if (Date.now() > market.expiresAt) return Response.json({ error: 'Poll is closed' }, { status: 409, headers: CORS })

  const votes = market.votes ?? []
  // Deduplication: one vote per agent token per poll
  if (votes.some((v) => v.agentTokenId === auth.agent.tokenId)) {
    return Response.json({ error: 'This agent has already voted on this poll' }, { status: 409, headers: CORS })
  }

  votes.push({
    userId:       auth.agent.tokenId,
    name:         auth.agent.agentName,
    side:         vote,
    authorType:   'agent',
    reasoning:    reasoning || undefined,
    agentTokenId: auth.agent.tokenId,
    createdAt:    Date.now(),
  })
  market.votes = votes

  await saveMarket(market)

  return Response.json(
    { ok: true, pollId, vote, totalVotes: votes.length },
    { headers: CORS },
  )
}
