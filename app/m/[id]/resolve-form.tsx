'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ResolveForm({ marketId }: { marketId: string }) {
  const router = useRouter()
  const [open, setOpen]       = useState(false)
  const [outcome, setOutcome] = useState<'yes' | 'no'>('yes')
  const [name, setName]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleResolve(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketId, outcome, creatorName: name }),
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
      <button onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-gray-200 py-2 text-xs font-medium text-gray-400 hover:border-gray-300 hover:text-gray-600 transition">
        Creator? Mark the outcome
      </button>
    )
  }

  return (
    <form onSubmit={handleResolve} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Mark outcome</h3>
        <button type="button" onClick={() => { setOpen(false); setError('') }} className="text-gray-400 hover:text-gray-700 text-lg leading-none">×</button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(['yes', 'no'] as const).map((side) => (
          <button key={side} type="button" onClick={() => setOutcome(side)}
            className={`rounded-xl border py-2.5 text-sm font-bold transition ${
              outcome === side
                ? side === 'yes' ? 'border-green-400 bg-green-50 text-green-700' : 'border-red-300 bg-red-50 text-red-600'
                : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
            }`}>
            {side.toUpperCase()}
          </button>
        ))}
      </div>

      <div>
        <label className="mb-1.5 block text-xs text-gray-500">Your name (must match creator)</label>
        <input
          value={name} onChange={(e) => setName(e.target.value)}
          required placeholder="Creator name"
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition">
        {loading ? 'Saving…' : 'Confirm outcome →'}
      </button>
    </form>
  )
}
