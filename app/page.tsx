import Link from 'next/link'
import { getMarketIndex, getMarket, yesOdds, type Market } from '@/lib/kv'

function PreviewCard({ market }: { market: Market }) {
  const yesPct = yesOdds(market)
  const noPct  = 100 - yesPct
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
      <div className="flex gap-3 items-start">
        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex-shrink-0 flex items-center justify-center text-indigo-600 font-bold text-sm">
          {market.question[0]}
        </div>
        <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{market.question}</p>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 rounded-lg bg-green-50 border border-green-200 py-1.5 text-center text-xs font-bold text-green-700">
          Yes {yesPct}%
        </div>
        <div className="flex-1 rounded-lg bg-red-50 border border-red-200 py-1.5 text-center text-xs font-bold text-red-600">
          No {noPct}%
        </div>
      </div>
      <div className="text-xs text-gray-400 flex justify-between">
        <span>{(market.votes ?? []).length} votes</span>
        <span>by {market.creatorName}</span>
      </div>
    </div>
  )
}

export const revalidate = 0

export default async function LandingPage() {
  const ids = await getMarketIndex(3)
  const markets = (await Promise.all(ids.map(getMarket))).filter((m): m is Market => m !== null)

  return (
    <main>
      {/* Hero */}
      <section className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-200 px-4 py-1.5 text-xs font-semibold text-indigo-600 mb-6">
            Personal prediction markets
          </div>
          <h1 className="text-5xl font-extrabold text-gray-900 leading-tight tracking-tight mb-4">
            Predict your life.<br />Let the crowd decide.
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8 leading-relaxed">
            Ask a question about anything happening in your world — a friend&apos;s habit, a group trip, a life decision.
            Vote YES or NO. See what everyone actually thinks.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/explore"
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition shadow-sm"
            >
              Explore predictions →
            </Link>
            <Link
              href="/create"
              className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition"
            >
              + Create one
            </Link>
          </div>
        </div>
      </section>

      {/* Feature bullets */}
      <section className="bg-[#f5f6fa] border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: '🎯', title: 'Make a prediction', body: 'Ask any YES/NO question about real life — bets between friends, personal goals, group plans.' },
              { icon: '🗳️', title: 'Crowd votes', body: 'Anyone can weigh in. One vote per person. See the real odds as they update live.' },
              { icon: '📊', title: 'See who\'s right', body: 'When it\'s over, the creator marks the outcome. The crowd\'s collective wisdom lives on.' },
            ].map(({ icon, title, body }) => (
              <div key={title} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="text-2xl mb-3">{icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending preview */}
      {markets.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 py-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Trending right now</h2>
            <Link href="/explore" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              See all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {markets.map((m) => (
              <Link key={m.id} href={`/m/${m.id}`}>
                <PreviewCard market={m} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
