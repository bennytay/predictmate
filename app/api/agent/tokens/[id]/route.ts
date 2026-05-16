import { type NextRequest } from 'next/server'
import { revokeToken } from '@/lib/agent-tokens'
import { sanitizeText } from '@/lib/sanitize'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const ownerId = req.nextUrl.searchParams.get('ownerId') ?? ''

  if (!ownerId.trim()) {
    return Response.json({ error: 'ownerId query param is required' }, { status: 400 })
  }

  const ok = await revokeToken(sanitizeText(id, 64), sanitizeText(ownerId, 64))
  if (!ok) {
    return Response.json({ error: 'Token not found or does not belong to you' }, { status: 404 })
  }

  return Response.json({ ok: true })
}
