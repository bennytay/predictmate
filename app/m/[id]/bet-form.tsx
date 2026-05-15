'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Side = 'yes' | 'no'

export default function BetForm({ marketId }: { marketId: string }) {
  const router = useRouter()
  const [side, setSide] = useState<Side>('yes')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [placedBetId, setPlacedBetId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketId, name, side, amount: Number(amount) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Something went wrong')
      setPlacedBetId(json.bet.id)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function copyPositionLink() {
    const url = `${window.location.origin}/m/${marketId}/p/${placedBetId}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (placedBetId) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
        <div className="text-center">
          <p className="text-3xl mb-2">🎯</p>
          <p className="font-semibold text-white">You&apos;re in!</p>
          <p className="mt-1 text-sm text-zinc-400">
            <span className={side === 'yes' ? 'font-bold text-emerald-400' : 'font-bold text-red-400'}>
              {side.toUpperCase()}
            </span>{' '}
            · ${Number(amount).toLocaleString()}
          </p>
        </div>

        <button
          onClick={copyPositionLink}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700"
        >
          {copied ? '✓ Link copied!' : '🔗 Share my position'}
        </button>

        <button
          onClick={() => { setPlacedBetId(null); setAmount(''); setError('') }}
          className="w-full text-sm text-zinc-600 hover:text-zinc-400"
        >
          Bet again
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4"
    >
      <h2 className="font-semibold text-white">Place your bet</h2>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setSide('yes')}
          className={`rounded-xl border py-3 text-sm font-bold transition ${
            side === 'yes'
              ? 'border-emerald-500 bg-emerald-950 text-emerald-400'
              : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500'
          }`}
        >
          YES
        </button>
        <button
          type="button"
          onClick={() => setSide('no')}
          className={`rounded-xl border py-3 text-sm font-bold transition ${
            side === 'no'
              ? 'border-red-500 bg-red-950 text-red-400'
              : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500'
          }`}
        >
          NO
        </button>
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-zinc-400">Your name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={50}
          placeholder="Jordan"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-zinc-400">Amount ($)</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            required
            min={1}
            max={1000000}
            step={1}
            placeholder="100"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-8 pr-4 text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`w-full rounded-xl py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
          side === 'yes'
            ? 'bg-emerald-600 text-white hover:bg-emerald-500'
            : 'bg-red-600 text-white hover:bg-red-500'
        }`}
      >
        {loading ? 'Placing…' : `Bet ${side.toUpperCase()} →`}
      </button>
    </form>
  )
}
