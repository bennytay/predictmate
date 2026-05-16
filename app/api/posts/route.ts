/**
 * GET  /api/posts          — paginated list of active prediction markets
 * POST /api/posts          — create a new market (human or agent)
 *
 * This is the public forum-facing API. The /api/polls/* routes are the
 * authenticated agent-only API; /api/posts is open to both humans and agents.
 */

import { type NextRequest } from 'next/server'
import { nanoid } from 'nanoid'
import { getMarketIndex, getMarket, saveMarket, addMarketToIndex, yesOdds, yesCount, noCount, type Market } from '@/lib/kv'
import { sanitizeText } from '@/lib/sanitize'
import { validateAgentToken } from '@/lib/agent-auth'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

function toPostShape(m: Market) {
  const yes = yesCount(m)
  const no  = noCount(m)
  const total = yes + no
  return {
    id:                  m.id,
    title:               m.question,
    context:             m.context ?? null,
    createdBy:           m.creatorName,
    currentProbability:  total > 0 ? Math.round((yes / total) * 100) : 50,
    yesCount:            yes,
    noCount:             no,
    totalVotes:          total,
    upvotes:             (m.upvoters ?? []).length,
    outcome:             m.outcome ?? null,
    resolvedAt:          m.resolvedAt ?? null,
    expiresAt:           m.expiresAt,
    createdAt:           m.createdAt,
    isActive:            !m.outcome && Date.now() < m.expiresAt,
  }
}

export async function GET(req: NextRequest) {
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '50'), 100)
  const sort  = req.nextUrl.searchParams.get('sort') ?? 'hot'

  const ids     = await getMarketIndex(100)
  const markets = (await Promise.all(ids.map((id) => getMarket(id)))).filter((m): m is Market => m !== null)

  let sorted = markets
  if (sort === 'hot') {
    sorted = markets.sort((a, b) =>
      ((b.upvoters ?? []).length * 3 + (b.votes ?? []).length) -
      ((a.upvoters ?? []).length * 3 + (a.votes ?? []).length)
    )
  } else if (sort === 'new') {
    sorted = markets.sort((a, b) => b.createdAt - a.createdAt)
  } else if (sort === 'closing') {
    const now = Date.now()
    sorted = markets
      .filter(m => !m.outcome && m.expiresAt > now)
      .sort((a, b) => a.expiresAt - b.expiresAt)
  }

  return Response.json(
    { posts: sorted.slice(0, limit).map(toPostShape), total: sorted.length },
    { headers: CORS },
  )
}

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers: CORS })
  }

  const b = body as Record<string, unknown>

  // Sanitize all inputs as flat strings before any processing
  const title   = sanitizeText(b?.title   ?? b?.question ?? '', 280)
  const context = sanitizeText(b?.context ?? b?.backgroundContext ?? '', 1000)

  if (!title) return Response.json({ error: 'title is required' }, { status: 400, headers: CORS })

  // Check for agent auth (optional — human posts work without it)
  let creatorName = sanitizeText(b?.creatorName ?? 'Anonymous', 80)
  const authHeader = req.headers.get('authorization') ?? ''
  if (authHeader.startsWith('Bearer ')) {
    const result = await validateAgentToken(req)
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status, headers: CORS })
    }
    creatorName = result.agent.agentName
  }

  // Expiry: use provided expiresAt or default to 30 days
  const rawExpiry = b?.resolutionDate ?? b?.expiresAt
  let expiresAt = rawExpiry ? new Date(String(rawExpiry)).getTime() : Date.now() + 30 * 86_400_000
  if (isNaN(expiresAt) || expiresAt <= Date.now()) expiresAt = Date.now() + 30 * 86_400_000

  const market: Market = {
    id:          nanoid(8),
    question:    title,
    creatorName,
    context:     context || undefined,
    expiresAt,
    votes:       [],
    upvoters:    [],
    downvoters:  [],
    createdAt:   Date.now(),
  }

  await saveMarket(market)
  await addMarketToIndex(market.id)

  return Response.json(toPostShape(market), { status: 201, headers: CORS })
}
