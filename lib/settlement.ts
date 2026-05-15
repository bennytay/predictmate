import type { Bet, Market } from './kv'

export type WinnerResult = Bet & { profit: number; payout: number }
export type LoserResult = Bet & { loss: number }
export type Debt = { from: string; to: string; amount: number }

export type Settlement = {
  outcome: 'yes' | 'no'
  winningPool: number
  losingPool: number
  winners: WinnerResult[]
  losers: LoserResult[]
  debts: Debt[]
}

export function calculateSettlement(market: Market): Settlement | null {
  if (!market.outcome) return null

  const outcome = market.outcome
  const winningPool = outcome === 'yes' ? market.yesPool : market.noPool
  const losingPool = outcome === 'yes' ? market.noPool : market.yesPool

  const winners = market.bets.filter((b) => b.side === outcome)
  const losers = market.bets.filter((b) => b.side !== outcome)

  const winnerResults: WinnerResult[] = winners.map((w) => ({
    ...w,
    profit: winningPool > 0 ? (w.amount / winningPool) * losingPool : 0,
    payout: winningPool > 0 ? w.amount + (w.amount / winningPool) * losingPool : w.amount,
  }))

  const loserResults: LoserResult[] = losers.map((l) => ({ ...l, loss: l.amount }))

  // Each loser pays each winner proportionally to the winner's share of the winning pool.
  const debts: Debt[] = []
  if (winningPool > 0) {
    for (const loser of losers) {
      for (const winner of winners) {
        const amount = loser.amount * (winner.amount / winningPool)
        debts.push({
          from: loser.name,
          to: winner.name,
          amount: Math.round(amount * 100) / 100,
        })
      }
    }
  }

  return { outcome, winningPool, losingPool, winners: winnerResults, losers: loserResults, debts }
}

export function getBetResult(
  settlement: Settlement,
  betId: string
): { won: boolean; profit: number; payout: number; loss: number } | null {
  const winner = settlement.winners.find((w) => w.id === betId)
  if (winner) return { won: true, profit: winner.profit, payout: winner.payout, loss: 0 }
  const loser = settlement.losers.find((l) => l.id === betId)
  if (loser) return { won: false, profit: 0, payout: 0, loss: loser.loss }
  return null
}
