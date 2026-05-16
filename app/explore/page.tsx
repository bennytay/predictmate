import Link from 'next/link'
import { getMarketIndex, getMarket, saveMarket, addMarketToIndex, yesOdds, type Market, type Vote } from '@/lib/kv'

export const revalidate = 0

// ── Fake seed data ──────────────────────────────────────────────────────────

const NAMES = ['Jordan', 'Alex', 'Sam', 'Morgan', 'Taylor', 'Casey', 'Riley', 'Quinn', 'Drew', 'Blake']

function makeVotes(yes: number, no: number): Vote[] {
  const votes: Vote[] = []
  for (let i = 0; i < yes; i++) {
    votes.push({ userId: `fy${i}`, name: NAMES[i % NAMES.length], side: 'yes', createdAt: Date.now() - (yes + no - i) * 180000 })
  }
  for (let i = 0; i < no; i++) {
    votes.push({ userId: `fn${i}`, name: NAMES[(i + 4) % NAMES.length], side: 'no', createdAt: Date.now() - (no - i) * 180000 })
  }
  return votes
}

const SEED_MARKETS: Omit<Market, 'id'>[] = [
  {
    question: 'Will the squad actually make it to Vegas this summer?',
    creatorName: 'Tyler',
    context: "We've been planning this trip for 2 years. Hotels booked, flights probably not.",
    expiresAt: Date.now() + 86400000 * 60,
    votes: makeVotes(14, 28),
    upvoters: ['u1','u2','u3','u4','u5','u6','u7','u8','u9','u10','u11','u12'],
    downvoters: ['u13'],
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    question: 'Will Alex get the promotion before Q3 ends?',
    creatorName: 'Sam',
    context: "Alex has been at the company for 3 years and just led a major project that shipped on time.",
    expiresAt: Date.now() + 86400000 * 45,
    votes: makeVotes(31, 12),
    upvoters: ['u1','u2','u3','u4','u5','u6','u7','u8'],
    downvoters: [],
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    question: 'Will Morgan keep their no-alcohol streak past 30 days?',
    creatorName: 'Jamie',
    context: "Morgan started dry January but it's now March. Impressive or over by Friday?",
    expiresAt: Date.now() + 86400000 * 14,
    votes: makeVotes(18, 41),
    upvoters: ['u1','u2','u3','u4','u5'],
    downvoters: ['u6'],
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    question: 'Does Taylor end up dating their coworker?',
    creatorName: 'Jordan',
    context: "The tension is REAL. They've had lunch together 4 days in a row this week.",
    expiresAt: Date.now() + 86400000 * 90,
    votes: makeVotes(52, 19),
    upvoters: ['u1','u2','u3','u4','u5','u6','u7','u8','u9','u10','u11','u12','u13','u14','u15','u16','u17','u18','u19','u20'],
    downvoters: ['u21','u22'],
    createdAt: Date.now() - 86400000 * 7,
  },
  {
    question: 'Will Casey actually finish the half-marathon this Sunday?',
    creatorName: 'Riley',
    context: "First half-marathon. Training started 10 weeks ago. Longest run so far: 11 miles.",
    expiresAt: Date.now() + 86400000 * 4,
    votes: makeVotes(38, 9),
    upvoters: ['u1','u2','u3','u4','u5','u6','u7','u8','u9','u10','u11','u12','u13','u14'],
    downvoters: [],
    createdAt: Date.now() - 86400000 * 1,
  },
  {
    question: 'Will Sam quit their job and go full freelance by year end?',
    creatorName: 'Quinn',
    context: "Sam has been freelancing on the side for 6 months and revenue is growing.",
    expiresAt: Date.now() + 86400000 * 200,
    votes: makeVotes(27, 33),
    upvoters: ['u1','u2','u3','u4','u5','u6','u7'],
    downvoters: ['u8','u9'],
    createdAt: Date.now() - 86400000 * 10,
  },
  {
    question: 'Will the friend group actually use the group chat they just made?',
    creatorName: 'Drew',
    context: "New group chat formed after a night out. Currently at 412 unread messages and it's been 3 hours.",
    expiresAt: Date.now() + 86400000 * 30,
    votes: makeVotes(11, 67),
    upvoters: ['u1','u2','u3','u4','u5','u6','u7','u8','u9','u10','u11','u12','u13','u14','u15','u16','u17','u18','u19','u20','u21','u22','u23','u24','u25'],
    downvoters: ['u26','u27','u28'],
    createdAt: Date.now() - 86400000 * 1,
  },
  {
    question: 'Will Blake get into the grad program they applied to?',
    creatorName: 'Morgan',
    context: "Blake applied to 5 programs. GPA is 3.8. Two letters of rec were from professors who barely know them.",
    expiresAt: Date.now() + 86400000 * 120,
    votes: makeVotes(44, 16),
    upvoters: ['u1','u2','u3','u4','u5','u6','u7','u8','u9','u10','u11'],
    downvoters: ['u12'],
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    question: 'Will Jordan propose on the Paris trip next month?',
    creatorName: 'Alex',
    context: "Jordan has been dating their partner for 4 years. Booked a fancy restaurant in Paris. Hmm.",
    expiresAt: Date.now() + 86400000 * 35,
    votes: makeVotes(61, 12),
    upvoters: ['u1','u2','u3','u4','u5','u6','u7','u8','u9','u10','u11','u12','u13','u14','u15','u16','u17','u18','u19','u20','u21','u22','u23'],
    downvoters: ['u24','u25'],
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    question: 'Will the office fantasy football champion be dethroned this season?',
    creatorName: 'Casey',
    context: "Chris has won 3 years in a row. But their top two picks both got injured in preseason.",
    expiresAt: Date.now() + 86400000 * 150,
    votes: makeVotes(29, 37),
    upvoters: ['u1','u2','u3','u4','u5','u6','u7','u8','u9'],
    downvoters: ['u10','u11'],
    createdAt: Date.now() - 86400000 * 6,
  },
  {
    question: 'Will Riley finish painting their apartment before guests arrive this weekend?',
    creatorName: 'Taylor',
    context: "Started painting Wednesday. Three rooms. Still needs a second coat. Guests arrive Saturday noon.",
    expiresAt: Date.now() + 86400000 * 2,
    votes: makeVotes(8, 52),
    upvoters: ['u1','u2','u3','u4','u5','u6','u7','u8','u9','u10','u11','u12','u13','u14','u15','u16','u17','u18','u19','u20'],
    downvoters: ['u21'],
    createdAt: Date.now() - 86400000 * 1,
  },
  {
    question: 'Will Drew land their first client for the new consulting business this month?',
    creatorName: 'Blake',
    context: "Quit corporate 6 weeks ago. Has 3 discovery calls lined up. Savings runway: 5 months.",
    expiresAt: Date.now() + 86400000 * 18,
    votes: makeVotes(33, 21),
    upvoters: ['u1','u2','u3','u4','u5','u6','u7','u8','u9','u10','u11','u12'],
    downvoters: ['u13','u14','u15'],
    createdAt: Date.now() - 86400000 * 3,
  },
]

async function seedIfEmpty() {
  const existing = await getMarketIndex(1)
  if (existing.length > 0) return

  for (let i = 0; i < SEED_MARKETS.length; i++) {
    const id = `demo${(i + 1).toString().padStart(2, '0')}`
    const market: Market = { id, ...SEED_MARKETS[i] }
    await saveMarket(market)
    await addMarketToIndex(id)
  }
}

// ── Card component ───────────────────────────────────────────────────────────

function MarketCard({ market }: { market: Market }) {
  const yesPct     = yesOdds(market)
  const noPct      = 100 - yesPct
  const totalVotes = (market.votes ?? []).length
  const upvotes    = (market.upvoters ?? []).length
  const isExpired  = Date.now() > market.expiresAt
  const isSettled  = !!market.outcome

  const initial = market.question.replace(/[^a-zA-Z]/g, '')[0]?.toUpperCase() ?? '?'
  const colors  = ['bg-violet-100 text-violet-600', 'bg-indigo-100 text-indigo-600', 'bg-blue-100 text-blue-600', 'bg-emerald-100 text-emerald-600', 'bg-amber-100 text-amber-600', 'bg-pink-100 text-pink-600']
  const colorCls = colors[market.id.charCodeAt(market.id.length - 1) % colors.length]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3 h-full hover:shadow-md hover:border-gray-300 transition">

      {/* Icon + question */}
      <div className="flex gap-3 items-start">
        {market.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={market.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
        ) : (
          <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-sm ${colorCls}`}>
            {initial}
          </div>
        )}
        <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 flex-1">
          {market.question}
        </p>
      </div>

      {/* Probability */}
      <div className="flex items-baseline gap-1.5">
        {isSettled ? (
          <span className={`text-2xl font-extrabold ${market.outcome === 'yes' ? 'text-green-600' : 'text-red-600'}`}>
            {market.outcome === 'yes' ? 'YES' : 'NO'}
          </span>
        ) : (
          <>
            <span className="text-2xl font-extrabold text-gray-900">{yesPct}%</span>
            <span className="text-xs text-gray-400">chance</span>
          </>
        )}
      </div>

      {/* Progress bar */}
      {!isSettled && (
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-400 to-green-500" style={{ width: `${yesPct}%` }} />
        </div>
      )}

      {/* YES / NO pills */}
      <div className="flex gap-2">
        <div className="flex-1 rounded-lg bg-green-50 border border-green-200 py-1.5 text-center text-xs font-bold text-green-700">
          Yes {yesPct}%
        </div>
        <div className="flex-1 rounded-lg bg-red-50 border border-red-200 py-1.5 text-center text-xs font-bold text-red-600">
          No {noPct}%
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[11px] text-gray-400">
        <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-2">
          {upvotes > 0 && <span className="text-indigo-500">↑ {upvotes}</span>}
          {isExpired && !isSettled && <span className="text-gray-400">Closed</span>}
          <span>by {market.creatorName}</span>
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ExplorePage() {
  await seedIfEmpty()

  const ids     = await getMarketIndex(60)
  const markets = (await Promise.all(ids.map(getMarket))).filter((m): m is Market => m !== null)

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">All markets</h1>
          <p className="text-sm text-gray-400">{markets.length} predictions</p>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <button className="p-2 rounded-lg hover:bg-gray-100 transition" title="Search">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100 transition" title="Filter">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" /></svg>
          </button>
        </div>
      </div>

      {/* Market grid */}
      {markets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <p className="text-gray-500 mb-4">No predictions yet</p>
          <Link href="/create" className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition">
            Create the first one →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
