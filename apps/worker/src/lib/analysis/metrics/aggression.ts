import { avg, clampScore, rate, weightedScore } from '../normalizer.js'
import type { AggressionMetrics, MatchRow } from '../types.js'

const MAX_KILLS = 8
const MAX_DAMAGE = 600
const MAX_HEADSHOT_RATE = 0.6
const MAX_KP_RATE = 0.5

export function calcAggression(matches: MatchRow[]): { score: number; metrics: AggressionMetrics } {
  const avgKills = avg(matches.map((m) => m.kills))
  const avgDamage = avg(matches.map((m) => m.damageDealt))
  const avgAssists = avg(matches.map((m) => m.assists))
  const totalKills = matches.reduce((s, m) => s + m.kills, 0)
  const totalHeadshots = matches.reduce((s, m) => s + m.headshotKills, 0)
  const headshotRate = rate(totalHeadshots, totalKills)
  const kpRate = avg(
    matches.map((m) => rate(m.kills + m.assists, Math.max(1, m.totalPlayers))),
  )

  const score = weightedScore([
    [clampScore(avgKills, MAX_KILLS), 0.35],
    [clampScore(avgDamage, MAX_DAMAGE), 0.30],
    [clampScore(headshotRate, MAX_HEADSHOT_RATE), 0.20],
    [clampScore(kpRate, MAX_KP_RATE), 0.15],
  ])

  const damagePerKill = avg(matches.map((m) => m.damageDealt / Math.max(m.kills, 1)))
  const gamesWithKillsRate = matches.filter((m) => m.kills >= 1).length / matches.length
  const damagePerMinute = avg(matches.map((m) => m.damageDealt / Math.max(m.timeSurvived / 60, 0.1)))

  return {
    score,
    metrics: {
      avg_kills: avgKills,
      avg_damage: avgDamage,
      headshot_rate: headshotRate,
      avg_assists: avgAssists,
      kill_participation_rate: kpRate,
      damage_per_kill: damagePerKill,
      games_with_kills_rate: gamesWithKillsRate,
      damage_per_minute: damagePerMinute,
    },
  }
}
