import Link from 'next/link'
import { getMarketIndex, getMarket, yesOdds, type Market } from '@/lib/kv'

export const revalidate = 0

function MarketCard({ market }: { market: Market }) {
  const yesPct = yesOdds(market)
  const noPct = 100 - yesPct
  const totalVotes = (market.votes ?? []).length
  const upvotes = (market.upvoters ?? []).length
  const isExpired = Date.now() > market.expiresAt
  const isSettled = !!market.outcome

  return (
    <div className="group flex flex-col h-full rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden transition hover:border-zinc-700 hover:bg-zinc-800/60">
      {market.imageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={market.imageUrl} alt="" className="w-full h-36 object-cover group-hover:scale-[1.02] transition-transform duration-300" />
      ) : (
        <div className="h-20 bg-gradient-to-br from-violet-950/60 via-zinc-900 to-indigo-950/40" />
      )}

      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex items-center gap-2">
          {isSettled ? (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide ${
              market.outcome === 'yes' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
            }`}>
              {market.outcome!.toUpperCase()} RESOLVED
            </span>
          ) : isExpired ? (
            <span className="text-[10px] font-semibold text-zinc-600 tracking-wide">CLOSED</span>
          ) : (
            <span className="text-[10px] font-semibold text-violet-400 tracking-wide">OPEN</span>
          )}
        </div>

        <p className="text-sm font-semibold text-white leading-snug line-clamp-2 flex-1">
          {market.question}
        </p>

        <div>
          <div className="flex items-end justify-between mb-1.5">
            <span className="text-2xl font-extrabold text-emerald-400">{yesPct}%</span>
            <span className="text-base font-bold text-red-400">{noPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
              style={{ width: `${yesPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-zinc-600 font-medium">
            <span>YES</span>
            <span>NO</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-zinc-800 text-[11px] text-zinc-500">
          <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-2">
            {upvotes > 0 && <span className="text-violet-400">↑ {upvotes}</span>}
            <span>by {market.creatorName}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function ExplorePage() {
  const ids = await getMarketIndex(50)
  const markets = (
    await Promise.all(ids.map((id) => getMarket(id)))
  ).filter((m): m is Market => m !== null)

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Explore</h1>
          <p className="mt-1 text-sm text-zinc-500">Community predictions about real life</p>
        </div>
        <Link
          href="/create"
          className="rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition"
        >
          + Create
        </Link>
      </div>

      {markets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 text-center">
          <p className="text-zinc-500 text-base mb-6">No predictions yet — be the first.</p>
          <Link
            href="/create"
            className="rounded-xl bg-violet-600 px-7 py-3 text-sm font-semibold text-white hover:bg-violet-500 transition"
          >
            Create a prediction →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {markets.map((market) => (
            <Link key={market.id} href={`/m/${market.id}`} className="flex">
              <MarketCard market={market} />
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
