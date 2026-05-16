'use client'

import { useState, useEffect } from 'react'

function getUserId(): string {
  let id = localStorage.getItem('pm_user_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('pm_user_id', id)
  }
  return id
}

export default function UpvoteBar({
  marketId,
  upvotes: initUp,
  downvotes: initDown,
}: {
  marketId: string
  upvotes: number
  downvotes: number
}) {
  const [upvotes, setUpvotes]       = useState(initUp)
  const [downvotes, setDownvotes]   = useState(initDown)
  const [userAction, setUserAction] = useState<'up' | 'down' | null>(null)
  const [loading, setLoading]       = useState(false)
  const [ready, setReady]           = useState(false)

  useEffect(() => {
    const action = localStorage.getItem(`pm_upvote_${marketId}`) as 'up' | 'down' | null
    setUserAction(action)
    setReady(true)
  }, [marketId])

  async function handleAction(action: 'up' | 'down') {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/upvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketId, userId: getUserId(), action }),
      })
      const json = await res.json()
      if (res.ok) {
        setUpvotes(json.upvotes)
        setDownvotes(json.downvotes)
        const next = userAction === action ? null : action
        setUserAction(next)
        if (next) localStorage.setItem(`pm_upvote_${marketId}`, next)
        else localStorage.removeItem(`pm_upvote_${marketId}`)
      }
    } finally {
      setLoading(false)
    }
  }

  if (!ready) return null

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <button
        onClick={() => handleAction('up')}
        className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${
          userAction === 'up'
            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
            : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
        }`}
      >
        ↑ {upvotes}
      </button>
      <button
        onClick={() => handleAction('down')}
        className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${
          userAction === 'down'
            ? 'bg-red-950 text-red-400 border border-red-900'
            : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
        }`}
      >
        ↓ {downvotes}
      </button>
      <span className="ml-auto text-[11px] text-zinc-600">Rate this</span>
    </div>
  )
}
