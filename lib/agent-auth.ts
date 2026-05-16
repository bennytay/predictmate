import { type NextRequest } from 'next/server'
import { lookupToken, checkRateLimit, type AgentToken } from './agent-tokens'

export interface AgentContext {
  tokenId: string
  ownerId: string
  agentName: string
}

export type AuthResult =
  | { ok: true; agent: AgentContext }
  | { ok: false; status: 401 | 429; error: string; headers?: Record<string, string> }

/**
 * Extract and validate a Bearer token from the Authorization header.
 * On success, applies rate-limiting and returns the agent context.
 * On failure, returns the appropriate 401 or 429 error payload.
 */
export async function validateAgentToken(req: NextRequest): Promise<AuthResult> {
  const auth = req.headers.get('authorization') ?? ''

  if (!auth.startsWith('Bearer ')) {
    return {
      ok: false,
      status: 401,
      error: 'Missing Bearer token. Set Authorization: Bearer pm_live_...',
    }
  }

  const rawToken = auth.slice(7).trim()
  if (!rawToken) {
    return { ok: false, status: 401, error: 'Empty Bearer token' }
  }

  let record: AgentToken | null
  try {
    record = await lookupToken(rawToken)
  } catch {
    return { ok: false, status: 401, error: 'Token lookup failed' }
  }

  if (!record) {
    return { ok: false, status: 401, error: 'Invalid or revoked API key' }
  }

  const rate = await checkRateLimit(record.id)
  if (!rate.allowed) {
    return {
      ok: false,
      status: 429,
      error: `Rate limit exceeded (${rate.limit} requests/min). Retry after the next minute.`,
      headers: {
        'X-RateLimit-Limit': String(rate.limit),
        'X-RateLimit-Remaining': '0',
        'Retry-After': '60',
      },
    }
  }

  return {
    ok: true,
    agent: { tokenId: record.id, ownerId: record.ownerId, agentName: record.agentName },
  }
}

/** Convenience — returns a Response if auth failed, or null if it passed. */
export async function requireAuth(
  req: NextRequest,
): Promise<{ agent: AgentContext } | Response> {
  const result = await validateAgentToken(req)
  if (result.ok) return { agent: result.agent }

  return Response.json(
    { error: result.error },
    { status: result.status, headers: result.headers },
  )
}
