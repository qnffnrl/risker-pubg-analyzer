import { calcAggression } from './metrics/aggression.js'
import { calcSurvival } from './metrics/survival.js'
import { calcPositioning } from './metrics/positioning.js'
import { calcTeamplay } from './metrics/teamplay.js'
import type { AnalysisResult, MatchRow } from './types.js'

export { type MatchRow, type AnalysisResult }

export function analyzePlayStyle(matches: MatchRow[]): AnalysisResult {
  if (matches.length === 0) {
    return emptyResult()
  }

  const aggression = calcAggression(matches)
  const survival = calcSurvival(matches)
  const positioning = calcPositioning(matches)
  const teamplay = calcTeamplay(matches)

  return {
    matchCount: matches.length,
    aggressionScore: round2(aggression.score),
    survivalScore: round2(survival.score),
    positioningScore: round2(positioning.score),
    teamplayScore: round2(teamplay.score),
    aggressionMetrics: aggression.metrics,
    survivalMetrics: survival.metrics,
    positioningMetrics: positioning.metrics,
    teamplayMetrics: teamplay.metrics,
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function emptyResult(): AnalysisResult {
  const emptyAgg = { avg_kills: 0, avg_damage: 0, headshot_rate: 0, avg_assists: 0, kill_participation_rate: 0 }
  const emptySur = { avg_survival_time_sec: 0, avg_placement: 0, top10_rate: 0, win_rate: 0, avg_boosts: 0, avg_heals: 0 }
  const emptyPos = { avg_walk_distance: 0, avg_vehicle_distance: 0, vehicle_usage_rate: 0, avg_weapons_acquired: 0, top10_rate: 0 }
  const emptyTeam = { avg_revives: 0, avg_assists: 0, avg_team_kills: 0, support_score: 0 }
  return {
    matchCount: 0,
    aggressionScore: 0, survivalScore: 0, positioningScore: 0, teamplayScore: 0,
    aggressionMetrics: emptyAgg,
    survivalMetrics: emptySur,
    positioningMetrics: emptyPos,
    teamplayMetrics: emptyTeam,
  }
}
