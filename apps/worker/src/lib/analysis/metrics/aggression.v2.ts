import type { MatchRow } from '../types.js'

export interface AggressionV2Metrics {
  damage_per_minute: number       // 25% — from aggregate
  first_engagement_score: number  // 30% — stub: 0 until telemetry
  kill_distance_score: number     // 25% — stub: 0 until telemetry
  zone_entry_score: number        // 20% — stub: 0 until telemetry
  telemetry_available: boolean
}

export function calcAggressionV2(
  matches: MatchRow[],
  _telemetry?: Map<string, unknown[]>,
): { score: number; metrics: AggressionV2Metrics } {
  if (matches.length === 0) return { score: 0, metrics: { damage_per_minute: 0, first_engagement_score: 0, kill_distance_score: 0, zone_entry_score: 0, telemetry_available: false } }

  // Only compute aggregate-based component
  const avgDmgPerMin = matches.reduce((s, r) => {
    const mins = Math.max(r.timeSurvived / 60, 1)
    return s + r.damageDealt / mins
  }, 0) / matches.length

  const dmgPerMinScore = Math.min(100, (avgDmgPerMin / 20) * 100)  // 20 dmg/min = 100

  // v2 score: only 25% of weight is available without telemetry
  const score = dmgPerMinScore * 0.25

  return {
    score: Math.round(score * 100) / 100,
    metrics: {
      damage_per_minute: Math.round(avgDmgPerMin * 100) / 100,
      first_engagement_score: 0,
      kill_distance_score: 0,
      zone_entry_score: 0,
      telemetry_available: false,
    },
  }
}
