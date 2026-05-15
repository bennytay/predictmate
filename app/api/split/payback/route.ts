import { type NextRequest } from 'next/server'
import { nanoid } from 'nanoid'
import { getSplitGroup, saveSplitGroup } from '@/lib/kv'

export async function POST(req: NextRequest) {
  const { groupId, from, to, amount, note } = await req.json()

  if (!groupId || !from?.trim() || !to?.trim() || !amount || Number(amount) <= 0) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (from.trim().toLowerCase() === to.trim().toLowerCase()) {
    return Response.json({ error: 'From and to must be different people' }, { status: 400 })
  }

  const group = await getSplitGroup(groupId)
  if (!group) return Response.json({ error: 'Group not found' }, { status: 404 })

  const payback = {
    id: nanoid(8),
    from: from.trim().slice(0, 50),
    to: to.trim().slice(0, 50),
    amount: Math.round(Number(amount) * 100) / 100,
    note: (note?.trim() || '').slice(0, 100),
    createdAt: Date.now(),
  }

  if (!group.paybacks) group.paybacks = []
  group.paybacks.push(payback)
  await saveSplitGroup(group)

  return Response.json({ payback })
}
