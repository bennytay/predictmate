import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getMarket, yesOdds } from '@/lib/kv'
import { calculateSettlement } from '@/lib/settlement'
import BetForm from './bet-form'
import CopyCodeButton from './copy-code-button'
import SettleForm from './settle-form'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const market = await getMarket(id)
  if (!market) return { title: 'Not found' }

  return {
    title: market.question,
    description: `Created by ${market.creatorName}. Vote YES or NO!`,
    openGraph: {
      title: market.question,
      description: `${yesOdds(market)}% YES · ${market.bets.length} bets`,
      images: [`/api/og/${id}`],
    },
    twitter: {
      card: 'summary_large_image',
      title: market.question,
      images: [`/api/og/${id}`],
    },
  }
}

export default async function MarketPage({ params }: Props) {
  const { id } = await params
  const market = await getMarket(id)
  if (!market) notFound()

  const total = market.yesPool + market.noPool
  const yesPct = yesOdds(market)
  const noPct = 100 - yesPct
  const isExpired = Date.now() > market.expiresAt
  const isSettled = !!market.outcome
  const settlement = calculateSettlement(market)

  const expiryLabel = new Date(market.expiresAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="w-full max-w-xl space-y-5">

        {/* Header */}
        <div>
          <a href="/" className="text-sm text-violet-400 hover:text-violet-300">← PredictMate</a>
          <h1 className="mt-4 text-2xl font-bold leading-snug text-white">{market.question}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            by {market.creatorName} ·{' '}
            {isSettled ? (
              <span className="text-zinc-600">
                Settled {new Date(market.resolvedAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            ) : isExpired ? (
              <span className="text-zinc-600">Closed {expiryLabel}</span>
            ) : (
              <span>Closes {expiryLabel}</span>
            )}
          </p>
        </div>

        {/* Settled outcome banner */}
        {isSettled && (
          <div className={`rounded-2xl border px-5 py-4 ${
            market.outcome === 'yes'
              ? 'border-emerald-800 bg-emerald-950'
              : 'border-red-800 bg-red-950'
          }`}>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Final outcome</p>
            <p className={`mt-1 text-3xl font-extrabold ${
              market.outcome === 'yes' ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {market.outcome === 'yes' ? 'YES' : 'NO'} WON
            </p>
          </div>
        )}

        {/* Poll code */}
        <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Poll code</p>
            <p className="mt-0.5 font-mono text-xl font-bold tracking-widest text-white">{market.id}</p>
          </div>
          <CopyCodeButton code={market.id} />
        </div>

        {/* Odds card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-end justify-between mb-3">
            <div className="flex gap-6">
              <div>
                <div className="text-3xl font-extrabold text-emerald-400">{yesPct}%</div>
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Yes</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-red-400">{noPct}%</div>
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">No</div>
              </div>
            </div>
            <div className="text-right text-sm text-zinc-500">
              <div className="font-medium text-zinc-300">${total.toLocaleString()}</div>
              <div>{market.bets.length} bet{market.bets.length !== 1 ? 's' : ''}</div>
            </div>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full rounded-l-full bg-emerald-500 transition-all" style={{ width: `${yesPct}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-zinc-600">
            <span>${market.yesPool.toLocaleString()} YES</span>
            <span>${market.noPool.toLocaleString()} NO</span>
          </div>
        </div>

        {/* Settlement receipt */}
        {isSettled && settlement && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="px-5 pt-5 pb-3 border-b border-zinc-800">
              <h2 className="font-semibold text-white">Settlement receipt</h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Losing pool of ${settlement.losingPool.toLocaleString()} distributed proportionally to winners
              </p>
            </div>

            {/* Winners */}
            {settlement.winners.length > 0 && (
              <div className="px-5 py-3 border-b border-zinc-800">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-500">
                  Winners ({market.outcome!.toUpperCase()})
                </p>
                <ul className="space-y-1.5">
                  {settlement.winners.map((w) => (
                    <li key={w.id} className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">{w.name}</span>
                      <span className="font-medium text-emerald-400">
                        +${w.profit.toLocaleString(undefined, { maximumFractionDigits: 2 })} profit
                        <span className="ml-2 text-zinc-500 font-normal">
                          (staked ${w.amount.toLocaleString()}, payout ${w.payout.toLocaleString(undefined, { maximumFractionDigits: 2 })})
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Losers */}
            {settlement.losers.length > 0 && (
              <div className="px-5 py-3 border-b border-zinc-800">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-500">
                  Losers ({market.outcome === 'yes' ? 'NO' : 'YES'})
                </p>
                <ul className="space-y-1.5">
                  {settlement.losers.map((l) => (
                    <li key={l.id} className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">{l.name}</span>
                      <span className="font-medium text-red-400">
                        −${l.loss.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Who owes whom */}
            {settlement.debts.length > 0 && (
              <div className="px-5 py-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Who pays whom
                </p>
                <ul className="space-y-2">
                  {settlement.debts.map((d, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-red-400 font-medium">{d.from}</span>
                      <span className="text-zinc-600">pays</span>
                      <span className="text-emerald-400 font-medium">{d.to}</span>
                      <span className="ml-auto font-semibold text-white">
                        ${d.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {settlement.winners.length === 0 && (
              <div className="px-5 py-4 text-sm text-zinc-500">
                No one bet on the winning side — all bets stand as-is.
              </div>
            )}
          </div>
        )}

        {/* Bet form or closed state */}
        {!isSettled && (
          isExpired ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center text-zinc-500">
              Betting is closed.
            </div>
          ) : (
            <BetForm marketId={market.id} />
          )
        )}

        {/* Settle button — shown when not yet settled */}
        {!isSettled && <SettleForm marketId={market.id} />}

        {/* Bet history */}
        {market.bets.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Positions</h2>
            <ul className="space-y-2">
              {[...market.bets].reverse().map((bet) => (
                <li
                  key={bet.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                      bet.side === 'yes' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                    }`}>
                      {bet.side.toUpperCase()}
                    </span>
                    <span className="text-sm text-white">{bet.name}</span>
                  </div>
                  <span className="text-sm font-medium text-zinc-400">${bet.amount.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </main>
  )
}
