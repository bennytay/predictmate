import { type NextRequest } from 'next/server'
import { createAgentToken, getTokensByOwner } from '@/lib/agent-tokens'
import { sanitizeText } from '@/lib/sanitize'

export async function GET(req: NextRequest) {
  const ownerId = req.nextUrl.searchParams.get('ownerId') ?? ''
  if (!ownerId.trim()) {
    return Response.json({ error: 'ownerId is required' }, { status: 400 })
  }

  const tokens = await getTokensByOwner(sanitizeText(ownerId, 64))
  // Strip tokenHash before sending to client
  const safe = tokens.map(({ tokenHash: _h, ...rest }) => rest)

  return Response.json({ tokens: safe })
}

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const b = body as Record<string, unknown>
  const ownerId   = sanitizeText(b?.ownerId   ?? '', 64)
  const agentName = sanitizeText(b?.agentName ?? '', 80)

  if (!ownerId) return Response.json({ error: 'ownerId is required' }, { status: 400 })

  const { record, rawToken } = await createAgentToken(ownerId, agentName)

  return Response.json(
    {
      token: { ...record, tokenHash: undefined },
      rawToken, // shown exactly once — client must store it immediately
    },
    { status: 201 },
  )
}
