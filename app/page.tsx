'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

const TIME_OPTIONS = [
  { label: 'Morning', display: '9 AM',    value: '09:00' },
  { label: 'Noon',    display: '12 PM',   value: '12:00' },
  { label: 'Afternoon', display: '3 PM',  value: '15:00' },
  { label: 'Evening', display: '6 PM',    value: '18:00' },
  { label: 'Night',   display: '10 PM',   value: '22:00' },
  { label: 'Midnight', display: '11:59',  value: '23:59' },
]

function getDateOptions() {
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const lbl = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const add = (n: number) => { const d = new Date(today); d.setDate(d.getDate() + n); return d }
  return [
    { label: 'Today',     sub: lbl(today),   value: fmt(today) },
    { label: 'Tomorrow',  sub: lbl(add(1)),   value: fmt(add(1)) },
    { label: '+2 days',   sub: lbl(add(2)),   value: fmt(add(2)) },
    { label: '+3 days',   sub: lbl(add(3)),   value: fmt(add(3)) },
    { label: 'Next week', sub: lbl(add(7)),   value: fmt(add(7)) },
    { label: '+2 weeks',  sub: lbl(add(14)),  value: fmt(add(14)) },
  ]
}

export default function Home() {
  const router = useRouter()

  // Market state
  const [question, setQuestion]       = useState('')
  const [creatorName, setCreatorName] = useState('')
  const [selectedTime, setSelectedTime] = useState('23:59')
  const [selectedDate, setSelectedDate] = useState('')
  const [marketLoading, setMarketLoading] = useState(false)
  const [marketError, setMarketError]   = useState('')
  const [createdCode, setCreatedCode]   = useState('')
  const [codeCopied, setCodeCopied]     = useState(false)
  const [joinCode, setJoinCode]         = useState('')

  // Split state
  const [splitTitle, setSplitTitle]     = useState('')
  const [splitLoading, setSplitLoading] = useState(false)
  const [splitJoinCode, setSplitJoinCode] = useState('')

  const dateOptions = useMemo(() => getDateOptions(), [])
  const effectiveDate = selectedDate || dateOptions[0].value

  async function handleMarketCreate(e: React.FormEvent) {
    e.preventDefault()
    setMarketError('')
    setMarketLoading(true)
    const expiresAt = new Date(`${effectiveDate}T${selectedTime}`).toISOString()
    try {
      const res = await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, creatorName, expiresAt }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Something went wrong')
      setCreatedCode(json.id)
    } catch (err) {
      setMarketError(err instanceof Error ? err.message : 'Something went wrong')
      setMarketLoading(false)
    }
  }

  function handleMarketJoin(e: React.FormEvent) {
    e.preventDefault()
    const code = joinCode.trim()
    if (code) router.push(`/m/${code}`)
  }

  async function handleSplitCreate(e: React.FormEvent) {
    e.preventDefault()
    setSplitLoading(true)
    try {
      const res = await fetch('/api/split/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: splitTitle }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Something went wrong')
      router.push(`/split/${json.id}`)
    } catch {
      setSplitLoading(false)
    }
  }

  function handleSplitJoin(e: React.FormEvent) {
    e.preventDefault()
    const code = splitJoinCode.trim()
    if (code) router.push(`/split/${code}`)
  }

  async function copyCode() {
    await navigator.clipboard.writeText(createdCode)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  // Success screen after market creation
  if (createdCode) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center space-y-6">
          <div>
            <p className="text-3xl mb-3">🎯</p>
            <h2 className="text-xl font-bold text-white">Poll created!</h2>
            <p className="mt-1 text-sm text-zinc-400">Share this code with your group so they can vote</p>
          </div>
          <div className="rounded-xl bg-zinc-800 border border-zinc-700 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">Poll code</p>
            <p className="text-4xl font-mono font-bold tracking-[0.2em] text-white">{createdCode}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={copyCode}
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
            >
              {codeCopied ? 'Copied!' : 'Copy code'}
            </button>
            <button
              onClick={() => router.push(`/m/${createdCode}`)}
              className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              View poll →
            </button>
          </div>
          <button
            onClick={() => { setCreatedCode(''); setMarketLoading(false) }}
            className="text-sm text-zinc-600 underline hover:text-zinc-400"
          >
            Create another
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-14">
      <div className="w-full max-w-md space-y-10">

        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">PredictMate</h1>
          <p className="mt-2 text-zinc-400">Make predictions. Split bills. With friends.</p>
        </div>

        {/* ── Prediction Market ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-lg">🎯</span>
            <h2 className="text-base font-semibold text-white">Prediction Market</h2>
          </div>

          <form
            onSubmit={handleMarketCreate}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-5"
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">The prediction</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
                maxLength={280}
                rows={2}
                placeholder="Will Ben finish his homework by Sunday?"
                className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Your name</label>
              <input
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                required
                maxLength={50}
                placeholder="Alex"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">Closes at — time</label>
              <div className="grid grid-cols-3 gap-2">
                {TIME_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedTime(opt.value)}
                    className={`flex flex-col items-center rounded-2xl border py-2.5 px-2 transition ${
                      selectedTime === opt.value
                        ? 'border-violet-500 bg-violet-950 text-violet-300'
                        : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-xs font-semibold">{opt.label}</span>
                    <span className="text-xs opacity-60 mt-0.5">{opt.display}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">Closes at — date</label>
              <div className="grid grid-cols-3 gap-2">
                {dateOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedDate(opt.value)}
                    className={`flex flex-col items-center rounded-2xl border py-2.5 px-2 transition ${
                      effectiveDate === opt.value
                        ? 'border-violet-500 bg-violet-950 text-violet-300'
                        : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-xs font-semibold">{opt.label}</span>
                    <span className="text-xs opacity-60 mt-0.5">{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {marketError && (
              <p className="rounded-lg bg-red-950 px-4 py-2.5 text-sm text-red-400">{marketError}</p>
            )}

            <button
              type="submit"
              disabled={marketLoading}
              className="w-full rounded-xl bg-violet-600 py-3 font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {marketLoading ? 'Creating…' : 'Create market →'}
            </button>
          </form>

          {/* Join existing market */}
          <form onSubmit={handleMarketJoin} className="flex gap-3">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              required
              placeholder="Join with code…"
              className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 font-mono text-sm text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <button
              type="submit"
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
            >
              Join →
            </button>
          </form>
        </section>

        {/* Divider */}
        <div className="border-t border-zinc-800" />

        {/* ── Bill Split ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-lg">🧾</span>
            <h2 className="text-base font-semibold text-white">Bill Split</h2>
          </div>

          <form
            onSubmit={handleSplitCreate}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4"
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">What&apos;s this split for?</label>
              <input
                value={splitTitle}
                onChange={(e) => setSplitTitle(e.target.value)}
                required
                maxLength={100}
                placeholder="Pizza night, road trip, groceries…"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            <button
              type="submit"
              disabled={splitLoading}
              className="w-full rounded-xl bg-violet-600 py-3 font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {splitLoading ? 'Creating…' : 'Start split →'}
            </button>
          </form>

          {/* Join existing split */}
          <form onSubmit={handleSplitJoin} className="flex gap-3">
            <input
              value={splitJoinCode}
              onChange={(e) => setSplitJoinCode(e.target.value)}
              required
              placeholder="Join with code…"
              className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 font-mono text-sm text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <button
              type="submit"
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
            >
              Join →
            </button>
          </form>
        </section>

        <p className="text-center text-xs text-zinc-600 pb-6">
          No accounts. No real money. Just bragging rights.
        </p>

      </div>
    </main>
  )
}
