import type { MatchRow } from '../types.js'

export interface SkillMetrics {
  kd_ratio: number
  avg_damage: number
  placement_score: number
}

function clampScore(value: number, max: number): number {
  return Math.min(100, (value / max) * 100)
}

export function calcSkill(matches: MatchRow[]): { score: number; metrics: SkillMetrics } {
  if (matches.length === 0) return { score: 0, metrics: { kd_ratio: 0, avg_damage: 0, placement_score: 0 } }

  const avgKills = matches.reduce((s, r) => s + r.kills, 0) / matches.length
  const avgPlacement = matches.reduce((s, r) => s + r.placement, 0) / matches.length
  const avgTotalPlayers = matches.reduce((s, r) => s + r.totalPlayers, 0) / matches.length
  const avgDamage = matches.reduce((s, r) => s + r.damageDealt, 0) / matches.length

  // KD approximation: kills / 1 (since we don't track deaths directly in MatchRow)
  const kdScore = clampScore(avgKills, 3)  // 3 kills/game = 100
  const damageScore = clampScore(avgDamage, 500)  // 500 dmg = 100
  const placementScore = Math.max(0, ((avgTotalPlayers - avgPlacement) / Math.max(avgTotalPlayers, 1)) * 100)

  const score = kdScore * 0.4 + damageScore * 0.3 + placementScore * 0.3

  return {
    score: Math.round(score * 100) / 100,
    metrics: {
      kd_ratio: Math.round(avgKills * 100) / 100,
      avg_damage: Math.round(avgDamage),
      placement_score: Math.round(placementScore * 100) / 100,
    },
  }
}
