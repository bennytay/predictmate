import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getSplitGroup, type Expense, type Payback } from '@/lib/kv'
import ExpenseForm from './expense-form'
import PaybackForm from './payback-form'
import CopyCodeButton from './copy-code-button'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const group = await getSplitGroup(id)
  if (!group) return { title: 'Not found' }
  return { title: `${group.title} — PredictMate Split` }
}

type NetEntry = { name: string; sent: number; received: number; net: number }

function calculateTally(paybacks: Payback[]) {
  const people = new Map<string, NetEntry>()

  const get = (name: string): NetEntry => {
    if (!people.has(name)) people.set(name, { name, sent: 0, received: 0, net: 0 })
    return people.get(name)!
  }

  for (const p of paybacks) {
    get(p.from).sent += p.amount
    get(p.to).received += p.amount
  }

  for (const entry of people.values()) {
    entry.net = entry.received - entry.sent
  }

  // Net debts between pairs: positive means "from owes to" this net amount
  const pairMap = new Map<string, number>()
  for (const p of paybacks) {
    const key = [p.from, p.to].sort().join('|')
    const sign = p.from < p.to ? 1 : -1
    pairMap.set(key, (pairMap.get(key) ?? 0) + sign * p.amount)
  }

  const pairDebts: { from: string; to: string; amount: number }[] = []
  for (const [key, net] of pairMap.entries()) {
    const [a, b] = key.split('|')
    if (Math.abs(net) > 0.005) {
      pairDebts.push(net > 0 ? { from: a, to: b, amount: Math.round(net * 100) / 100 } : { from: b, to: a, amount: Math.round(-net * 100) / 100 })
    }
  }

  return { people: [...people.values()].sort((a, b) => b.net - a.net), pairDebts }
}

export default async function SplitPage({ params }: Props) {
  const { id } = await params
  const group = await getSplitGroup(id)
  if (!group) notFound()

  const paybacks = group.paybacks ?? []
  const tally = calculateTally(paybacks)
  const totalExpenses = group.expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="w-full max-w-xl space-y-5">

        {/* Header */}
        <div>
          <a href="/" className="text-sm text-violet-400 hover:text-violet-300">← PredictMate</a>
          <h1 className="mt-4 text-2xl font-bold text-white">{group.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Bill split · {group.expenses.length} expense{group.expenses.length !== 1 ? 's' : ''} · ${totalExpenses.toLocaleString(undefined, { maximumFractionDigits: 2 })} total
          </p>
        </div>

        {/* Group code */}
        <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Group code</p>
            <p className="mt-0.5 font-mono text-xl font-bold tracking-widest text-white">{group.id}</p>
          </div>
          <CopyCodeButton code={group.id} />
        </div>

        {/* Running tally */}
        {paybacks.length > 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="px-5 pt-5 pb-3 border-b border-zinc-800">
              <h2 className="font-semibold text-white">Running tally</h2>
              <p className="mt-0.5 text-xs text-zinc-500">Net payback balances — who has sent and received money</p>
            </div>

            {tally.people.length > 0 && (
              <div className="px-5 py-3 border-b border-zinc-800">
                <ul className="space-y-1.5">
                  {tally.people.map((p) => (
                    <li key={p.name} className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">{p.name}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-zinc-500">
                          sent ${p.sent.toLocaleString(undefined, { maximumFractionDigits: 2 })} · rcvd ${p.received.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                        <span className={`font-semibold text-sm ${
                          p.net > 0.005 ? 'text-emerald-400' : p.net < -0.005 ? 'text-red-400' : 'text-zinc-500'
                        }`}>
                          {p.net > 0.005 ? `+$${p.net.toLocaleString(undefined, { maximumFractionDigits: 2 })}` :
                           p.net < -0.005 ? `-$${Math.abs(p.net).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : 'even'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tally.pairDebts.length > 0 && (
              <div className="px-5 py-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Net between pairs</p>
                <ul className="space-y-2">
                  {tally.pairDebts.map((d, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-red-400 font-medium">{d.from}</span>
                      <span className="text-zinc-600">→</span>
                      <span className="text-emerald-400 font-medium">{d.to}</span>
                      <span className="ml-auto font-semibold text-white">
                        ${d.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Log expense */}
        <ExpenseForm groupId={group.id} />

        {/* Log payback */}
        <PaybackForm groupId={group.id} />

        {/* Expense history */}
        {group.expenses.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Expenses</h2>
            <ul className="space-y-2">
              {[...group.expenses].reverse().map((e: Expense) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
                >
                  <div>
                    <p className="text-sm text-white">{e.description}</p>
                    <p className="text-xs text-zinc-500">{e.payer} paid</p>
                  </div>
                  <span className="text-sm font-semibold text-white">
                    ${e.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Payback history */}
        {paybacks.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Paybacks</h2>
            <ul className="space-y-2">
              {[...paybacks].reverse().map((p: Payback) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
                >
                  <div>
                    <p className="text-sm text-white">
                      <span className="text-red-400">{p.from}</span>
                      <span className="text-zinc-500 mx-1.5">→</span>
                      <span className="text-emerald-400">{p.to}</span>
                    </p>
                    {p.note && <p className="text-xs text-zinc-500">{p.note}</p>}
                  </div>
                  <span className="text-sm font-semibold text-white">
                    ${p.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </main>
  )
}
