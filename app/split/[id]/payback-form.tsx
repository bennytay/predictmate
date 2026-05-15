'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PaybackForm({ groupId }: { groupId: string }) {
  const router = useRouter()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/split/payback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, from, to, amount: Number(amount), note }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Something went wrong')
      setAmount('')
      setNote('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4"
    >
      <h2 className="font-semibold text-white">Log a payback</h2>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm text-zinc-400">Who paid?</label>
          <input
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            required
            maxLength={50}
            placeholder="Jordan"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-zinc-400">Paid back to?</label>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            required
            maxLength={50}
            placeholder="Alex"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm text-zinc-400">Amount ($)</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              required
              min={0.01}
              step={0.01}
              placeholder="20.00"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-8 pr-4 text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-zinc-400">Note <span className="text-zinc-600">(optional)</span></label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={100}
            placeholder="For pizza"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Logging…' : 'Log payback →'}
      </button>
    </form>
  )
}
