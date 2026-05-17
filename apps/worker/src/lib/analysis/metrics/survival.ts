import { avg, clampScore, rate, weightedScore } from '../normalizer.js'
import type { MatchRow, SurvivalMetrics } from '../types.js'

const MAX_SURVIVAL_TIME = 1800
const MAX_BOOSTS = 8
const MAX_HEALS = 10

export function calcSurvival(matches: MatchRow[]): { score: number; metrics: SurvivalMetrics } {
  const avgSurvivalTime = avg(matches.map((m) => m.timeSurvived))
  const avgPlacement = avg(matches.map((m) => m.placement))
  const top10Rate = rate(
    matches.filter((m) => m.placement <= 10).length,
    matches.length,
  )
  const winRate = rate(
    matches.filter((m) => m.placement === 1).length,
    matches.length,
  )
  const avgBoosts = avg(matches.map((m) => m.boosts))
  const avgHeals = avg(matches.map((m) => m.heals))

  // placement score: lower is better (1st = 100, last = 0)
  const avgPlayers = avg(matches.map((m) => m.totalPlayers))
  const placementScore = clampScore(Math.max(0, avgPlayers - avgPlacement), avgPlayers)

  const score = weightedScore([
    [clampScore(avgSurvivalTime, MAX_SURVIVAL_TIME), 0.40],
    [clampScore(avgBoosts, MAX_BOOSTS), 0.25],
    [clampScore(avgHeals, MAX_HEALS), 0.20],
    [placementScore, 0.15],
  ])

  const survivalRatio = avg(matches.map((m) => m.timeSurvived / Math.max(m.durationSec, 1)))
  const top10Count = matches.filter((m) => m.placement <= 10).length
  const winCount = matches.filter((m) => m.placement === 1).length
  const top10ToWinRate = top10Count > 0 ? winCount / top10Count : 0
  const boostRatio = avg(matches.map((m) => m.boosts / Math.max(m.boosts + m.heals, 1)))
  const totalItemsPerGame = avg(matches.map((m) => m.heals + m.boosts))

  return {
    score,
    metrics: {
      avg_survival_time_sec: avgSurvivalTime,
      avg_placement: avgPlacement,
      top10_rate: top10Rate,
      win_rate: winRate,
      avg_boosts: avgBoosts,
      avg_heals: avgHeals,
      survival_ratio: survivalRatio,
      top10_to_win_rate: top10ToWinRate,
      boost_ratio: boostRatio,
      total_items_per_game: totalItemsPerGame,
    },
  }
}
