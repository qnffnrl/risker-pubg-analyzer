import type { MatchRow, ConsistencyMetrics } from '../types.js'

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

export function calcConsistency(matches: MatchRow[]): { score: number; metrics: ConsistencyMetrics } {
  if (matches.length === 0) {
    return { score: 0, metrics: { kill_consistency: 0, damage_consistency: 0 } }
  }

  const kills = matches.map(m => m.kills)
  const damages = matches.map(m => m.damageDealt)

  const avgKills = kills.reduce((a, b) => a + b, 0) / kills.length
  const avgDamage = damages.reduce((a, b) => a + b, 0) / damages.length

  const killConsistency = clamp(1 - stdDev(kills) / Math.max(avgKills, 0.01), 0, 1)
  const damageConsistency = clamp(1 - stdDev(damages) / Math.max(avgDamage, 0.01), 0, 1)

  const score = Math.round((killConsistency * 50 + damageConsistency * 50) * 100) / 100

  return {
    score,
    metrics: {
      kill_consistency: Math.round(killConsistency * 1000) / 1000,
      damage_consistency: Math.round(damageConsistency * 1000) / 1000,
    },
  }
}
