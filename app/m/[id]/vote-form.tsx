'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

function getUserId(): string {
  let id = localStorage.getItem('pm_user_id')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('pm_user_id', id) }
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
    const saved  = localStorage.getItem('pm_name')
    if (saved) setName(saved)
    const voted = localStorage.getItem(`pm_voted_${marketId}`)
    if (voted === 'yes' || voted === 'no') { setHasVoted(true); setVotedSide(voted) }
    setReady(true)
  }, [marketId])

  async function vote(side: 'yes' | 'no') {
    if (!name.trim()) return
    setError(''); setLoading(true)
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
      setHasVoted(true); setVotedSide(side)
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
      <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Your vote</p>
        <p className={`text-3xl font-extrabold ${votedSide === 'yes' ? 'text-green-600' : 'text-red-600'}`}>
          {votedSide?.toUpperCase()}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Your name</label>
        <input
          value={name} onChange={(e) => setName(e.target.value)}
          maxLength={50} placeholder="Jordan"
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => vote('yes')} disabled={loading || !name.trim()}
          className="rounded-xl border-2 border-green-300 bg-green-50 py-3 text-sm font-bold text-green-700 hover:bg-green-100 hover:border-green-400 disabled:opacity-40 disabled:cursor-not-allowed transition">
          Vote YES
        </button>
        <button onClick={() => vote('no')} disabled={loading || !name.trim()}
          className="rounded-xl border-2 border-red-200 bg-red-50 py-3 text-sm font-bold text-red-600 hover:bg-red-100 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed transition">
          Vote NO
        </button>
      </div>

      <p className="text-center text-[11px] text-gray-400">One vote per person</p>
    </div>
  )
}
