import { type NextRequest } from 'next/server'
import { nanoid } from 'nanoid'
import { getSplitGroup, saveSplitGroup } from '@/lib/kv'

export async function POST(req: NextRequest) {
  const { groupId, payer, description, amount } = await req.json()

  if (!groupId || !payer?.trim() || !amount || Number(amount) <= 0) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const group = await getSplitGroup(groupId)
  if (!group) return Response.json({ error: 'Group not found' }, { status: 404 })

  const expense = {
    id: nanoid(8),
    payer: payer.trim().slice(0, 50),
    description: (description?.trim() || 'Expense').slice(0, 100),
    amount: Math.round(Number(amount) * 100) / 100,
    createdAt: Date.now(),
  }
  group.expenses.push(expense)
  await saveSplitGroup(group)

  return Response.json({ expense })
}
