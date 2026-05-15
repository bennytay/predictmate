'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Side = 'yes' | 'no'

export default function SettleForm({ marketId }: { marketId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [outcome, setOutcome] = useState<Side>('yes')
  const [creatorName, setCreatorName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSettle(e: React.FormEvent) {
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
        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 py-2.5 text-sm font-medium text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200"
      >
        Settle this market
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSettle}
      className="rounded-2xl border border-zinc-700 bg-zinc-900 p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">Settle market</h3>
        <button
          type="button"
          onClick={() => { setOpen(false); setError('') }}
          className="text-zinc-500 hover:text-zinc-300 text-lg leading-none"
        >
          ×
        </button>
      </div>

      <div>
        <p className="mb-2 text-sm text-zinc-400">What was the outcome?</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setOutcome('yes')}
            className={`rounded-xl border py-2.5 text-sm font-bold transition ${
              outcome === 'yes'
                ? 'border-emerald-500 bg-emerald-950 text-emerald-400'
                : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500'
            }`}
          >
            YES
          </button>
          <button
            type="button"
            onClick={() => setOutcome('no')}
            className={`rounded-xl border py-2.5 text-sm font-bold transition ${
              outcome === 'no'
                ? 'border-red-500 bg-red-950 text-red-400'
                : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500'
            }`}
          >
            NO
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-zinc-400">
          Your name <span className="text-zinc-600">(must match creator name to confirm)</span>
        </label>
        <input
          value={creatorName}
          onChange={(e) => setCreatorName(e.target.value)}
          required
          placeholder="Creator name"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Settling…' : 'Confirm & settle →'}
      </button>
    </form>
  )
}
