'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ExpenseForm({ groupId }: { groupId: string }) {
  const router = useRouter()
  const [payer, setPayer] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/split/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, payer, description, amount: Number(amount) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Something went wrong')
      setAmount('')
      setDescription('')
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
      <h2 className="font-semibold text-white">Log an expense</h2>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm text-zinc-400">Who paid?</label>
          <input
            value={payer}
            onChange={(e) => setPayer(e.target.value)}
            required
            maxLength={50}
            placeholder="Alex"
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
              min={0.01}
              step={0.01}
              placeholder="42.00"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-8 pr-4 text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-zinc-400">What for? <span className="text-zinc-600">(optional)</span></label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={100}
          placeholder="Pizza"
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
        {loading ? 'Adding…' : 'Add expense →'}
      </button>
    </form>
  )
}
