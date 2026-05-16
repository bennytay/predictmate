import { ImageResponse } from 'next/og'
import { getMarket, yesOdds } from '@/lib/kv'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const market = await getMarket(id)
  if (!market) return new Response('Not found', { status: 404 })

  const yesPct     = yesOdds(market)
  const noPct      = 100 - yesPct
  const totalVotes = (market.votes ?? []).length
  const isExpired  = Date.now() > market.expiresAt
  const isSettled  = !!market.outcome

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0d0d11',
          padding: '56px 64px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#a78bfa' }}>PredictMate</span>
          {isSettled ? (
            <span style={{ fontSize: 13, fontWeight: 600, color: market.outcome === 'yes' ? '#34d399' : '#f87171', background: market.outcome === 'yes' ? '#052e16' : '#450a0a', padding: '2px 10px', borderRadius: 999 }}>
              {market.outcome!.toUpperCase()} RESOLVED
            </span>
          ) : isExpired ? (
            <span style={{ fontSize: 13, fontWeight: 600, color: '#52525b', background: '#18181b', padding: '2px 10px', borderRadius: 999 }}>CLOSED</span>
          ) : (
            <span style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa', background: '#2e1065', padding: '2px 10px', borderRadius: 999 }}>OPEN</span>
          )}
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          fontSize: market.question.length > 100 ? 34 : market.question.length > 60 ? 42 : 50,
          fontWeight: 700,
          color: '#f4f4f5',
          lineHeight: 1.25,
        }}>
          {market.question}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#052e16', border: '1px solid #14532d', padding: '10px 20px', borderRadius: 14 }}>
            <span style={{ fontSize: 34, fontWeight: 800, color: '#34d399' }}>{yesPct}%</span>
            <span style={{ fontSize: 15, color: '#6ee7b7' }}>YES</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#450a0a', border: '1px solid #7f1d1d', padding: '10px 20px', borderRadius: 14 }}>
            <span style={{ fontSize: 34, fontWeight: 800, color: '#f87171' }}>{noPct}%</span>
            <span style={{ fontSize: 15, color: '#fca5a5' }}>NO</span>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 15, color: '#52525b' }}>
            {totalVotes} vote{totalVotes !== 1 ? 's' : ''} · by {market.creatorName}
          </div>
        </div>

        <div style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', background: '#27272a' }}>
          <div style={{ width: `${yesPct}%`, background: '#22c55e' }} />
          <div style={{ width: `${noPct}%`, background: '#ef4444' }} />
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
