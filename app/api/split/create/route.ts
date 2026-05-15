import { type NextRequest } from 'next/server'
import { nanoid } from 'nanoid'
import { saveSplitGroup } from '@/lib/kv'

export async function POST(req: NextRequest) {
  const { title } = await req.json()
  if (!title?.trim()) return Response.json({ error: 'Title required' }, { status: 400 })

  const group = {
    id: nanoid(8),
    title: title.trim().slice(0, 100),
    expenses: [],
    paybacks: [],
    createdAt: Date.now(),
  }
  await saveSplitGroup(group)
  return Response.json({ id: group.id })
}
