import type { MatchRow } from '../types.js'

export interface SurvivalV2Metrics {
  avoidance_score: number
  zone_edge_score: number
  heal_preemptive_score: number
  isolation_score: number
  telemetry_available: boolean
}

export function calcSurvivalV2(
  matches: MatchRow[],
  _telemetry?: Map<string, unknown[]>,
): { score: number; metrics: SurvivalV2Metrics } {
  if (matches.length === 0) return { score: 0, metrics: { avoidance_score: 0, zone_edge_score: 0, heal_preemptive_score: 0, isolation_score: 0, telemetry_available: false } }
  // All survival v2 metrics need telemetry — return 0 until available
  return {
    score: 0,
    metrics: { avoidance_score: 0, zone_edge_score: 0, heal_preemptive_score: 0, isolation_score: 0, telemetry_available: false },
  }
}
