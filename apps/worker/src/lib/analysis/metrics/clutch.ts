import type { MatchRow, ClutchMetrics } from '../types.js'

export function calcClutch(matches: MatchRow[]): { score: number; metrics: ClutchMetrics } {
  if (matches.length === 0) {
    return { score: 0, metrics: { knock_finish_rate: 0, kill_streak_avg: 0, top10_to_win_rate: 0 } }
  }

  // knock_finish_rate: only for games where dbnos > 0
  const gamesWithKnocks = matches.filter(m => m.dbnos > 0)
  const knockFinishRate = gamesWithKnocks.length > 0
    ? gamesWithKnocks.reduce((sum, m) => sum + m.kills / Math.max(m.dbnos, 1), 0) / gamesWithKnocks.length
    : 0

  const killStreakAvg = matches.reduce((sum, m) => sum + m.killStreaks, 0) / matches.length

  const top10Count = matches.filter(m => m.placement <= 10).length
  const winCount = matches.filter(m => m.placement === 1).length
  const top10ToWinRate = top10Count > 0 ? winCount / top10Count : 0

  // Score: knock_finish_rate*50 + top10_to_win_rate(capped at 33%)*30 + kill_streak_avg(capped at 3)*20
  const score = Math.round((
    knockFinishRate * 50 +
    Math.min(top10ToWinRate / 0.33, 1) * 30 +
    Math.min(killStreakAvg / 3, 1) * 20
  ) * 100) / 100

  return {
    score,
    metrics: {
      knock_finish_rate: Math.round(knockFinishRate * 1000) / 1000,
      kill_streak_avg: Math.round(killStreakAvg * 100) / 100,
      top10_to_win_rate: Math.round(top10ToWinRate * 1000) / 1000,
    },
  }
}
