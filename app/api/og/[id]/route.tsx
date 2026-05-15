import { ImageResponse } from 'next/og'
import { getMarket, yesOdds } from '@/lib/kv'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const market = await getMarket(id)

  if (!market) return new Response('Not found', { status: 404 })

  const total = market.yesPool + market.noPool
  const yesPct = yesOdds(market)
  const noPct = 100 - yesPct
  const isExpired = Date.now() > market.expiresAt

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#09090b',
          padding: '60px 64px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '36px' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#a78bfa', letterSpacing: '-0.3px' }}>
            PredictMate
          </div>
          {isExpired && (
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#71717a',
                backgroundColor: '#27272a',
                padding: '3px 10px',
                borderRadius: '999px',
              }}
            >
              Closed
            </div>
          )}
        </div>

        {/* Question */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            fontSize: market.question.length > 100 ? 34 : market.question.length > 60 ? 42 : 52,
            fontWeight: 700,
            color: '#f4f4f5',
            lineHeight: 1.25,
          }}
        >
          {market.question}
        </div>

        {/* Odds */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#052e16',
              border: '1px solid #14532d',
              padding: '10px 20px',
              borderRadius: '12px',
            }}
          >
            <span style={{ fontSize: 32, fontWeight: 800, color: '#34d399' }}>{yesPct}%</span>
            <span style={{ fontSize: 16, color: '#6ee7b7' }}>YES</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#450a0a',
              border: '1px solid #7f1d1d',
              padding: '10px 20px',
              borderRadius: '12px',
            }}
          >
            <span style={{ fontSize: 32, fontWeight: 800, color: '#f87171' }}>{noPct}%</span>
            <span style={{ fontSize: 16, color: '#fca5a5' }}>NO</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginLeft: 'auto',
              fontSize: 16,
              color: '#52525b',
              gap: '6px',
            }}
          >
            <span>{market.bets.length} bet{market.bets.length !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span>{total.toLocaleString()} pts</span>
          </div>
        </div>

        {/* Bar */}
        <div
          style={{
            display: 'flex',
            height: '10px',
            borderRadius: '999px',
            overflow: 'hidden',
            backgroundColor: '#27272a',
          }}
        >
          <div style={{ width: `${yesPct}%`, backgroundColor: '#22c55e' }} />
          <div style={{ width: `${noPct}%`, backgroundColor: '#ef4444' }} />
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 14,
            color: '#52525b',
          }}
        >
          <span>by {market.creatorName}</span>
          <span>
            {isExpired ? 'Closed' : 'Closes'}{' '}
            {new Date(market.expiresAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
