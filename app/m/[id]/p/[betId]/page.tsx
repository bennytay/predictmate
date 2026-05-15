import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getMarket } from '@/lib/kv'
import { calculateSettlement, getBetResult } from '@/lib/settlement'

type Props = { params: Promise<{ id: string; betId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, betId } = await params
  const market = await getMarket(id)
  if (!market) return { title: 'Not found' }
  const bet = market.bets.find((b) => b.id === betId)
  if (!bet) return { title: 'Not found' }
  return {
    title: `${bet.name}'s position — ${market.question}`,
    description: `${bet.name} bet ${bet.side.toUpperCase()} · $${bet.amount} on PredictMate`,
  }
}

export default async function PositionPage({ params }: Props) {
  const { id, betId } = await params
  const market = await getMarket(id)
  if (!market) notFound()

  const bet = market.bets.find((b) => b.id === betId)
  if (!bet) notFound()

  const settlement = calculateSettlement(market)
  const result = settlement ? getBetResult(settlement, betId) : null

  const total = market.yesPool + market.noPool
  const yesPct = total > 0 ? Math.round((market.yesPool / total) * 100) : 50
  const noPct = 100 - yesPct
  const isYes = bet.side === 'yes'

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-4">

        {/* Position card */}
        <div className={`rounded-2xl border-2 p-6 space-y-4 ${
          result
            ? result.won
              ? 'border-emerald-600 bg-emerald-950'
              : 'border-red-700 bg-red-950'
            : isYes
              ? 'border-emerald-800 bg-zinc-900'
              : 'border-red-800 bg-zinc-900'
        }`}>

          {/* Brand */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-widest text-violet-400 uppercase">PredictMate</span>
            {result && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                result.won ? 'bg-emerald-800 text-emerald-300' : 'bg-red-800 text-red-300'
              }`}>
                {result.won ? 'WON' : 'LOST'}
              </span>
            )}
          </div>

          {/* Question */}
          <p className="text-base font-semibold text-white leading-snug">{market.question}</p>

          {/* Position */}
          <div className="flex items-center gap-3">
            <span className={`rounded-lg px-3 py-1.5 text-lg font-extrabold ${
              isYes ? 'bg-emerald-900 text-emerald-300' : 'bg-red-900 text-red-300'
            }`}>
              {bet.side.toUpperCase()}
            </span>
            <div>
              <p className="text-2xl font-bold text-white">${bet.amount.toLocaleString()}</p>
              <p className="text-xs text-zinc-400">{bet.name}</p>
            </div>
          </div>

          {/* Result (if settled) */}
          {result && (
            <div className={`rounded-xl px-4 py-3 ${
              result.won ? 'bg-emerald-900/50' : 'bg-red-900/50'
            }`}>
              {result.won ? (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-300">Profit</span>
                  <span className="font-bold text-emerald-300">
                    +${result.profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-300">Loss</span>
                  <span className="font-bold text-red-300">
                    −${result.loss.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Odds bar (if not settled) */}
          {!result && (
            <div>
              <div className="flex justify-between text-xs text-zinc-500 mb-1">
                <span className="text-emerald-500 font-medium">{yesPct}% YES</span>
                <span className="text-red-500 font-medium">{noPct}% NO</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full rounded-l-full bg-emerald-500" style={{ width: `${yesPct}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <a
          href={`/m/${market.id}`}
          className="block w-full rounded-xl bg-violet-600 py-3 text-center text-sm font-semibold text-white transition hover:bg-violet-500"
        >
          {market.outcome ? 'View settlement →' : 'Place your own bet →'}
        </a>

        <p className="text-center text-xs text-zinc-600">
          Poll code: <span className="font-mono text-zinc-500">{market.id}</span>
        </p>
      </div>
    </main>
  )
}
