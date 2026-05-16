'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ResolveForm({ marketId }: { marketId: string }) {
  const router = useRouter()
  const [open, setOpen]           = useState(false)
  const [outcome, setOutcome]     = useState<'yes' | 'no'>('yes')
  const [creatorName, setName]    = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  async function handleResolve(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketId, outcome, creatorName }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Something went wrong')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-zinc-800 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-400 hover:border-zinc-700 transition"
      >
        Creator? Mark the outcome
      </button>
    )
  }

  return (
    <form onSubmit={handleResolve} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Mark outcome</h3>
        <button type="button" onClick={() => { setOpen(false); setError('') }} className="text-zinc-500 hover:text-zinc-300 text-lg leading-none">×</button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(['yes', 'no'] as const).map((side) => (
          <button
            key={side}
            type="button"
            onClick={() => setOutcome(side)}
            className={`rounded-xl border py-2.5 text-sm font-bold transition ${
              outcome === side
                ? side === 'yes' ? 'border-emerald-500 bg-emerald-950 text-emerald-400' : 'border-red-500 bg-red-950 text-red-400'
                : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
            }`}
          >
            {side.toUpperCase()}
          </button>
        ))}
      </div>

      <div>
        <label className="mb-1.5 block text-xs text-zinc-500">Your name (must match creator)</label>
        <input
          value={creatorName}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Creator name"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Saving…' : 'Confirm outcome →'}
      </button>
    </form>
  )
}
