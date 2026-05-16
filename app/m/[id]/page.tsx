import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getMarket, yesOdds, yesCount, noCount } from '@/lib/kv'
import VoteForm from './vote-form'
import UpvoteBar from './upvote-bar'
import ResolveForm from './resolve-form'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const market = await getMarket(id)
  if (!market) return { title: 'Not found' }
  const yes = yesOdds(market)
  return {
    title: market.question,
    description: market.context || `${yes}% YES · Created by ${market.creatorName}`,
    openGraph: { images: [`/api/og/${id}`] },
    twitter: { card: 'summary_large_image', images: [`/api/og/${id}`] },
  }
}

export default async function MarketPage({ params }: Props) {
  const { id } = await params
  const market = await getMarket(id)
  if (!market) notFound()

  const yesPct     = yesOdds(market)
  const noPct      = 100 - yesPct
  const totalVotes = (market.votes ?? []).length
  const isExpired  = Date.now() > market.expiresAt
  const isSettled  = !!market.outcome
  const canVote    = !isExpired && !isSettled

  const expiryDate = new Date(market.expiresAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  const recentVotes = [...(market.votes ?? [])].reverse().slice(0, 15)

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <a href="/explore" className="inline-block mb-6 text-sm text-gray-400 hover:text-gray-700 transition">
        ← Explore
      </a>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: question + context + activity ── */}
        <div className="lg:col-span-2 space-y-5">

          {market.imageUrl && (
            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={market.imageUrl} alt="" className="w-full max-h-72 object-cover" />
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h1 className="text-xl font-bold text-gray-900 leading-snug">{market.question}</h1>
            <p className="mt-2 text-sm text-gray-400">
              by {market.creatorName}
              {' · '}
              {isSettled
                ? `Resolved ${new Date(market.resolvedAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                : isExpired
                  ? `Closed ${expiryDate}`
                  : `Closes ${expiryDate}`}
            </p>

            {isSettled && (
              <div className={`mt-4 rounded-xl border px-4 py-3 ${
                market.outcome === 'yes' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Resolved</p>
                <p className={`text-3xl font-extrabold ${market.outcome === 'yes' ? 'text-green-600' : 'text-red-600'}`}>
                  {market.outcome === 'yes' ? 'YES' : 'NO'}
                </p>
              </div>
            )}
          </div>

          {market.context && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Context</p>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{market.context}</p>
            </div>
          )}

          {recentVotes.length > 0 && (
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                Activity · {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
              </h2>
              <ul className="space-y-2">
                {recentVotes.map((v, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      v.side === 'yes' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                    }`}>
                      {v.side.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-700">{v.name}</span>
                    <span className="ml-auto text-[11px] text-gray-400">
                      {new Date(v.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recentVotes.length === 0 && canVote && (
            <div className="rounded-2xl border border-dashed border-gray-300 py-12 text-center bg-white">
              <p className="text-sm text-gray-400">Be the first to vote on this prediction.</p>
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-4">

          {/* Probability card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-end justify-between mb-5">
              <div>
                <div className="text-5xl font-extrabold text-green-600">{yesPct}%</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">chance YES</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-red-500">{noPct}%</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">chance NO</div>
              </div>
            </div>

            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
                style={{ width: `${yesPct}%` }}
              />
            </div>

            <div className="mt-3 flex justify-between text-[11px] text-gray-400">
              <span>{yesCount(market)} YES</span>
              <span>{noCount(market)} NO</span>
            </div>
          </div>

          {canVote ? (
            <VoteForm marketId={market.id} />
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white py-4 text-center text-sm text-gray-400 shadow-sm">
              {isSettled ? 'Market resolved' : 'Voting closed'}
            </div>
          )}

          <UpvoteBar
            marketId={market.id}
            upvotes={(market.upvoters ?? []).length}
            downvotes={(market.downvoters ?? []).length}
          />

          {!isSettled && <ResolveForm marketId={market.id} />}

        </div>
      </div>
    </main>
  )
}
