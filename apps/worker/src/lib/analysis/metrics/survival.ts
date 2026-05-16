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

  return {
    score,
    metrics: {
      avg_survival_time_sec: avgSurvivalTime,
      avg_placement: avgPlacement,
      top10_rate: top10Rate,
      win_rate: winRate,
      avg_boosts: avgBoosts,
      avg_heals: avgHeals,
    },
  }
}
