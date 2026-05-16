'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const TIME_OPTIONS = [
  { label: 'Morning',   display: '9 AM',   value: '09:00' },
  { label: 'Noon',      display: '12 PM',  value: '12:00' },
  { label: 'Afternoon', display: '3 PM',   value: '15:00' },
  { label: 'Evening',   display: '6 PM',   value: '18:00' },
  { label: 'Night',     display: '10 PM',  value: '22:00' },
  { label: 'Midnight',  display: '11:59',  value: '23:59' },
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

export default function CreateForm() {
  const router = useRouter()
  const [question, setQuestion] = useState('')
  const [name, setName]         = useState('')
  const [context, setContext]   = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [selectedTime, setTime] = useState('23:59')
  const [selectedDate, setDate] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const dateOptions   = useMemo(() => getDateOptions(), [])
  const effectiveDate = selectedDate || dateOptions[0].value

  useEffect(() => {
    const saved = localStorage.getItem('pm_name')
    if (saved) setName(saved)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const expiresAt = new Date(`${effectiveDate}T${selectedTime}`).toISOString()
    try {
      const res = await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, creatorName: name, expiresAt, context, imageUrl }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Something went wrong')
      localStorage.setItem('pm_name', name)
      router.push(`/m/${json.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const inputCls = 'w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
  const selectedBtn = 'border-indigo-500 bg-indigo-50 text-indigo-700'
  const unselectedBtn = 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Question</label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required maxLength={280} rows={3}
          placeholder="Will Alex get the promotion before Q3 ends?"
          className={inputCls + ' resize-none'}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Your name</label>
        <input
          value={name} onChange={(e) => setName(e.target.value)}
          required maxLength={50} placeholder="Jordan"
          className={inputCls}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Context <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={context} onChange={(e) => setContext(e.target.value)}
          maxLength={1000} rows={3}
          placeholder="Give people background so they can make an informed vote…"
          className={inputCls + ' resize-none'}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Image URL <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
          type="url" placeholder="https://..."
          className={inputCls}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Closes at — time</label>
        <div className="grid grid-cols-3 gap-2">
          {TIME_OPTIONS.map((opt) => (
            <button key={opt.value} type="button" onClick={() => setTime(opt.value)}
              className={`flex flex-col items-center rounded-2xl border py-2.5 transition text-sm ${selectedTime === opt.value ? selectedBtn : unselectedBtn}`}>
              <span className="font-semibold text-xs">{opt.label}</span>
              <span className="text-[10px] opacity-60 mt-0.5">{opt.display}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Closes at — date</label>
        <div className="grid grid-cols-3 gap-2">
          {dateOptions.map((opt) => (
            <button key={opt.value} type="button" onClick={() => setDate(opt.value)}
              className={`flex flex-col items-center rounded-2xl border py-2.5 transition ${effectiveDate === opt.value ? selectedBtn : unselectedBtn}`}>
              <span className="font-semibold text-xs">{opt.label}</span>
              <span className="text-[10px] opacity-60 mt-0.5">{opt.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit" disabled={loading}
        className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Publishing…' : 'Publish prediction →'}
      </button>
    </form>
  )
}
