import type { MatchRow } from '../types.js'

export interface TeamplayV2Metrics {
  proximity_score: number     // 35% — needs telemetry
  rescue_time_score: number   // 25% — needs telemetry
  first_down_avoid: number    // 20% — needs telemetry
  assist_rate: number         // 20% — from aggregate
  telemetry_available: boolean
}

export function calcTeamplayV2(
  matches: MatchRow[],
  _telemetry?: Map<string, unknown[]>,
): { score: number; metrics: TeamplayV2Metrics } {
  if (matches.length === 0) return { score: 0, metrics: { proximity_score: 0, rescue_time_score: 0, first_down_avoid: 0, assist_rate: 0, telemetry_available: false } }

  const avgAssists = matches.reduce((s, r) => s + r.assists, 0) / matches.length
  const assistScore = Math.min(100, (avgAssists / 3) * 100)  // 3 assists/game = 100

  return {
    score: Math.round(assistScore * 0.20 * 100) / 100,
    metrics: {
      proximity_score: 0,
      rescue_time_score: 0,
      first_down_avoid: 0,
      assist_rate: Math.round(avgAssists * 100) / 100,
      telemetry_available: false,
    },
  }
}
