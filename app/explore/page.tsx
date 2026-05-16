import Link from 'next/link'
import { getMarketIndex, getMarket, yesOdds, yesCount, noCount, type Market } from '@/lib/kv'

export const revalidate = 0

// ── Category chip helper ──────────────────────────────────────────────────────
const CATEGORY_PATTERNS: [RegExp, string][] = [
  [/ukraine|russia|ceasefire|nato|war|military|conflict/i, 'Geopolitics'],
  [/bitcoin|crypto|eth|nft|blockchain/i, 'Crypto'],
  [/fed|rate|gdp|inflation|economy|market|stock|sp500|nasdaq/i, 'Economy'],
  [/climate|temperature|carbon|emissions|energy|ev|electric/i, 'Climate'],
  [/ai|gpt|claude|llm|openai|anthropic|model|neural/i, 'AI & Tech'],
  [/election|senate|house|congress|president|vote|democrat|republican/i, 'Politics'],
  [/apple|google|meta|amazon|microsoft|nvidia|tesla/i, 'Tech Companies'],
  [/spacex|moon|nasa|rocket|mars|orbit/i, 'Space'],
  [/fifa|nba|nfl|world cup|championship|super bowl|oscar|grammy/i, 'Culture'],
  [/gym|diet|budget|roommate|ex|friend|date|proposal|relationship/i, 'Personal'],
  [/netflix|tiktok|instagram|streaming|platform/i, 'Media'],
]

function getCategory(question: string): string {
  for (const [re, label] of CATEGORY_PATTERNS) {
    if (re.test(question)) return label
  }
  return 'General'
}

const CATEGORY_COLORS: Record<string, string> = {
  Geopolitics:    'bg-rose-50 text-rose-700 border-rose-200',
  Crypto:         'bg-amber-50 text-amber-700 border-amber-200',
  Economy:        'bg-blue-50 text-blue-700 border-blue-200',
  Climate:        'bg-green-50 text-green-700 border-green-200',
  'AI & Tech':    'bg-violet-50 text-violet-700 border-violet-200',
  Politics:       'bg-red-50 text-red-700 border-red-200',
  'Tech Companies': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Space:          'bg-slate-50 text-slate-700 border-slate-200',
  Culture:        'bg-pink-50 text-pink-700 border-pink-200',
  Personal:       'bg-orange-50 text-orange-700 border-orange-200',
  Media:          'bg-teal-50 text-teal-700 border-teal-200',
  General:        'bg-gray-50 text-gray-600 border-gray-200',
}

// ── Market card ───────────────────────────────────────────────────────────────
function MarketCard({ market }: { market: Market }) {
  const yes        = yesCount(market)
  const no         = noCount(market)
  const total      = yes + no
  const yesPct     = total > 0 ? Math.round((yes / total) * 100) : 50
  const upvotes    = (market.upvoters ?? []).length
  const isSettled  = !!market.outcome
  const isExpired  = !isSettled && Date.now() > market.expiresAt
  const category   = getCategory(market.question)
  const catColor   = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.General

  const closingLabel = isSettled
    ? `Resolved ${new Date(market.resolvedAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : isExpired
      ? 'Closed'
      : `Closes ${new Date(market.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  // Probability color: green when Yes is likely, red when No is likely
  const probColor = isSettled
    ? market.outcome === 'yes' ? 'text-green-600' : 'text-red-600'
    : yesPct >= 60 ? 'text-green-600' : yesPct <= 40 ? 'text-red-500' : 'text-gray-800'

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col gap-0 h-full hover:shadow-md hover:border-gray-300 transition group overflow-hidden">

      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <span className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${catColor}`}>
          {category}
        </span>
        {upvotes > 0 && (
          <span className="flex items-center gap-0.5 text-[11px] text-gray-400 flex-shrink-0">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933A4 4 0 006 10.333z" /></svg>
            {upvotes}
          </span>
        )}
      </div>

      {/* Question */}
      <div className="px-4 pb-4">
        <p className="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2">
          {market.question}
        </p>
      </div>

      {/* Probability indicator — Polymarket style */}
      <div className="px-4 pb-3 flex items-end gap-2">
        {isSettled ? (
          <div className={`text-3xl font-black ${probColor}`}>
            {market.outcome!.toUpperCase()}
          </div>
        ) : (
          <>
            <div className={`text-3xl font-black leading-none ${probColor}`}>{yesPct}%</div>
            <div className="text-xs text-gray-400 mb-0.5 leading-tight">
              <span className="block font-semibold text-gray-500">CHANCE</span>
              <span>YES</span>
            </div>
          </>
        )}
        <div className="ml-auto text-right text-[11px] text-gray-400">
          <span className="block font-medium text-gray-600">{(100 - yesPct)}%</span>
          <span>NO</span>
        </div>
      </div>

      {/* Progress bar */}
      {!isSettled && (
        <div className="mx-4 mb-4 h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              yesPct >= 60 ? 'bg-green-500' : yesPct <= 40 ? 'bg-red-400' : 'bg-indigo-400'
            }`}
            style={{ width: `${yesPct}%` }}
          />
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto px-4 py-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 bg-gray-50/50">
        <span>{total.toLocaleString()} vote{total !== 1 ? 's' : ''}</span>
        <span className="truncate ml-2">{closingLabel}</span>
      </div>
    </div>
  )
}

// ── Sort + filter helpers ─────────────────────────────────────────────────────
function sortMarkets(markets: Market[], sort: string): Market[] {
  const now = Date.now()
  if (sort === 'new')     return [...markets].sort((a, b) => b.createdAt - a.createdAt)
  if (sort === 'closing') return [...markets].filter(m => !m.outcome && m.expiresAt > now).sort((a, b) => a.expiresAt - b.expiresAt)
  // 'hot' default: weighted by upvotes + volume
  return [...markets].sort((a, b) =>
    ((b.upvoters ?? []).length * 3 + (b.votes ?? []).length) -
    ((a.upvoters ?? []).length * 3 + (a.votes ?? []).length)
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
type Props = { searchParams: Promise<Record<string, string>> }

export default async function ExplorePage({ searchParams }: Props) {
  const sp    = await searchParams
  const sort  = ['hot', 'new', 'closing'].includes(sp.sort ?? '') ? sp.sort : 'hot'
  const cat   = sp.cat ?? 'all'

  const ids     = await getMarketIndex(100)
  const all     = (await Promise.all(ids.map(getMarket))).filter((m): m is Market => m !== null)

  const filtered = cat === 'all'
    ? all
    : all.filter((m) => getCategory(m.question).toLowerCase() === cat.toLowerCase())

  const markets = sortMarkets(filtered, sort)

  const categories = ['All', ...Array.from(new Set(all.map((m) => getCategory(m.question)))).sort()]

  const sortLabel: Record<string, string> = { hot: '🔥 Hot', new: '✨ New', closing: '⏱ Closing Soon' }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Prediction Markets</h1>
          <p className="text-sm text-gray-400">{markets.length} active · crowd consensus in real time</p>
        </div>

        {/* Sort tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {['hot', 'new', 'closing'].map((s) => (
            <Link
              key={s}
              href={`/explore?sort=${s}${cat !== 'all' ? `&cat=${cat}` : ''}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                sort === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {sortLabel[s]}
            </Link>
          ))}
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-5" style={{ scrollbarWidth: 'none' }}>
        {categories.map((c) => {
          const slug = c.toLowerCase()
          const isActive = cat === slug || (cat === 'all' && c === 'All')
          return (
            <Link
              key={c}
              href={`/explore?sort=${sort}&cat=${slug}`}
              className={`whitespace-nowrap flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-700'
              }`}
            >
              {c}
            </Link>
          )
        })}
      </div>

      {/* Grid */}
      {markets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <p className="text-gray-500 mb-4">No markets in this category yet.</p>
          <Link href="/create" className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition">
            Create the first one →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {markets.map((m) => (
            <Link key={m.id} href={`/m/${m.id}`} className="flex">
              <MarketCard market={m} />
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
