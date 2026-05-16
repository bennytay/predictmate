'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

function getUserId(): string {
  let id = localStorage.getItem('pm_user_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('pm_user_id', id)
  }
  return id
}

export default function VoteForm({ marketId }: { marketId: string }) {
  const router = useRouter()
  const [name, setName]           = useState('')
  const [hasVoted, setHasVoted]   = useState(false)
  const [votedSide, setVotedSide] = useState<'yes' | 'no' | null>(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [ready, setReady]         = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('pm_name')
    if (saved) setName(saved)
    const voted = localStorage.getItem(`pm_voted_${marketId}`)
    if (voted === 'yes' || voted === 'no') { setHasVoted(true); setVotedSide(voted) }
    setReady(true)
  }, [marketId])

  async function vote(side: 'yes' | 'no') {
    if (!name.trim()) return
    setError('')
    setLoading(true)

    try {
      const userId = getUserId()
      localStorage.setItem('pm_name', name.trim())
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketId, userId, name: name.trim(), side }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Something went wrong')
      localStorage.setItem(`pm_voted_${marketId}`, side)
      setHasVoted(true)
      setVotedSide(side)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!ready) return null

  if (hasVoted) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-center space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Your vote</p>
        <p className={`text-3xl font-extrabold ${votedSide === 'yes' ? 'text-emerald-400' : 'text-red-400'}`}>
          {votedSide?.toUpperCase()}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Your name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          placeholder="Jordan"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => vote('yes')}
          disabled={loading || !name.trim()}
          className="rounded-xl border-2 border-emerald-800 bg-emerald-950 py-3 text-sm font-bold text-emerald-300 transition hover:bg-emerald-900 hover:border-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Vote YES
        </button>
        <button
          onClick={() => vote('no')}
          disabled={loading || !name.trim()}
          className="rounded-xl border-2 border-red-900 bg-red-950 py-3 text-sm font-bold text-red-300 transition hover:bg-red-900 hover:border-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Vote NO
        </button>
      </div>

      <p className="text-center text-[11px] text-zinc-600">One vote per person</p>
    </div>
  )
}
