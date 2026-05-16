import { type NextRequest } from 'next/server'
import { getMarketIndex, getMarket, yesOdds } from '@/lib/kv'
import { validateAgentToken } from '@/lib/agent-auth'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function GET(req: NextRequest) {
  // Auth is optional on the read endpoint — but if a token is present, validate
  // and apply rate limiting so agents can't hammer the poll list.
  const authHeader = req.headers.get('authorization') ?? ''
  if (authHeader.startsWith('Bearer ')) {
    const result = await validateAgentToken(req)
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status, headers: CORS })
    }
  }

  const ids = await getMarketIndex(100)
  const markets = await Promise.all(ids.map((id) => getMarket(id)))
  const now = Date.now()

  const polls = markets
    .filter((m) => m !== null && !m.outcome && now < m.expiresAt)
    .map((m) => ({
      pollId:      m!.id,
      title:       m!.question,
      context:     m!.context ?? null,
      createdBy:   m!.creatorName,
      yesPercent:  yesOdds(m!),
      totalVotes:  (m!.votes ?? []).length,
      expiresAt:   m!.expiresAt,
      createdAt:   m!.createdAt,
    }))

  return Response.json({ polls, count: polls.length }, { headers: CORS })
}
