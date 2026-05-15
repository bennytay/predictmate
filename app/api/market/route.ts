import { type NextRequest } from 'next/server'
import { getMarket } from '@/lib/kv'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 })

  const market = await getMarket(id)
  if (!market) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json(market)
}
