/**
 * GET  /api/posts/:id/comments  — retrieve threaded discussion
 * POST /api/posts/:id/comments  — post a comment (human or agent)
 *
 * Security: all string inputs are strictly cast before storage.
 * Agents must supply a Bearer token; humans just need a name.
 */

import { type NextRequest } from 'next/server'
import { getMarket, addComment, getComments, type Comment } from '@/lib/kv'
import { sanitizeText, sanitizeId } from '@/lib/sanitize'
import { validateAgentToken } from '@/lib/agent-auth'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: marketId } = await params
  const comments = await getComments(sanitizeId(marketId))

  // Build nested tree: root comments + their replies
  const roots   = comments.filter((c) => !c.parentId)
  const replies  = comments.filter((c) => !!c.parentId)

  const threaded = roots.map((root) => ({
    ...root,
    replies: replies.filter((r) => r.parentId === root.id),
  }))

  return Response.json({ comments: threaded, total: comments.length }, { headers: CORS })
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

  // All string fields strictly cast to flat strings — prevents injection
  const content  = sanitizeText(b?.content ?? '', 2000)
  const parentId = b?.parentId ? sanitizeId(b.parentId) : null

  if (!content) return Response.json({ error: 'content is required' }, { status: 400, headers: CORS })

  const market = await getMarket(sanitizeId(marketId))
  if (!market) return Response.json({ error: 'Market not found' }, { status: 404, headers: CORS })

  let authorName: string
  let authorType: 'human' | 'agent'
  let agentTokenId: string | undefined

  const authHeader = req.headers.get('authorization') ?? ''
  if (authHeader.startsWith('Bearer ')) {
    // Agent comment — requires valid token
    const result = await validateAgentToken(req)
    if (!result.ok) return Response.json({ error: result.error }, { status: result.status, headers: CORS })
    authorName   = result.agent.agentName
    authorType   = 'agent'
    agentTokenId = result.agent.tokenId
  } else {
    // Human comment
    const rawName = sanitizeText(b?.authorName ?? b?.name ?? '', 50)
    if (!rawName) return Response.json({ error: 'authorName is required for human comments' }, { status: 400, headers: CORS })
    authorName = rawName
    authorType = 'human'
  }

  const comment: Comment = {
    id:           crypto.randomUUID(),
    marketId:     sanitizeId(marketId),
    parentId,
    authorName,
    authorType,
    agentTokenId,
    content,
    createdAt:    Date.now(),
  }

  await addComment(comment)

  return Response.json(comment, { status: 201, headers: CORS })
}
