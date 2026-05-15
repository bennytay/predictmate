'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Mode = 'create' | 'join'

export default function Home() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('create')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdCode, setCreatedCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [joinCode, setJoinCode] = useState('')

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = e.currentTarget
    const question = (form.elements.namedItem('question') as HTMLTextAreaElement).value
    const creatorName = (form.elements.namedItem('creatorName') as HTMLInputElement).value
    const time = (form.elements.namedItem('time') as HTMLInputElement).value
    const date = (form.elements.namedItem('date') as HTMLInputElement).value
    const expiresAt = new Date(`${date}T${time}`).toISOString()

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
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    const code = joinCode.trim()
    if (code) router.push(`/m/${code}`)
  }

  async function copyCode() {
    await navigator.clipboard.writeText(createdCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const today = new Date().toISOString().split('T')[0]

  if (createdCode) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center space-y-6">
            <div>
              <p className="text-3xl mb-3">🎯</p>
              <h2 className="text-xl font-bold text-white">Poll created!</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Share this code with your group so they can vote
              </p>
            </div>

            <div className="rounded-xl bg-zinc-800 border border-zinc-700 px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                Poll code
              </p>
              <p className="text-4xl font-mono font-bold tracking-[0.2em] text-white">
                {createdCode}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={copyCode}
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
              >
                {copied ? 'Copied!' : 'Copy code'}
              </button>
              <button
                onClick={() => router.push(`/m/${createdCode}`)}
                className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
              >
                View poll →
              </button>
            </div>

            <button
              onClick={() => { setCreatedCode(''); setError(''); setLoading(false) }}
              className="text-sm text-zinc-600 underline hover:text-zinc-400"
            >
              Create another
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">PredictMate</h1>
          <p className="mt-2 text-zinc-400">Make predictions with friends.</p>
        </div>

        {/* Mode toggle */}
        <div className="mb-5 flex rounded-xl border border-zinc-800 bg-zinc-900 p-1">
          {(['create', 'join'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError('') }}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                mode === m
                  ? 'bg-zinc-700 text-white shadow'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {m === 'create' ? 'Create a poll' : 'Vote on a poll'}
            </button>
          ))}
        </div>

        {mode === 'create' ? (
          <form
            onSubmit={handleCreate}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4"
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                The prediction
              </label>
              <textarea
                name="question"
                required
                maxLength={280}
                rows={3}
                placeholder="Will Ben finish his homework by Sunday?"
                className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Your name</label>
              <input
                name="creatorName"
                required
                maxLength={50}
                placeholder="Alex"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Closes at</label>
              <div className="flex gap-3">
                <input
                  name="time"
                  type="time"
                  required
                  className="w-36 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                <input
                  name="date"
                  type="date"
                  required
                  min={today}
                  className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-red-950 px-4 py-2.5 text-sm text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-violet-600 py-3 font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Creating…' : 'Create poll →'}
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleJoin}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4"
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Poll code</label>
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                required
                placeholder="e.g. abc12345"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 font-mono text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-violet-600 py-3 font-semibold text-white transition hover:bg-violet-500"
            >
              Go to poll →
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-zinc-600">
          No accounts. No real money. Just bragging rights.
        </p>
      </div>
    </main>
  )
}
