import { avg, clampScore, weightedScore } from '../normalizer.js'
import type { MatchRow, TeamplayMetrics } from '../types.js'

const MAX_REVIVES = 3
const MAX_ASSISTS = 5

export function calcTeamplay(matches: MatchRow[]): { score: number; metrics: TeamplayMetrics } {
  const avgRevives = avg(matches.map((m) => m.revives))
  const avgAssists = avg(matches.map((m) => m.assists))
  const avgTeamKills = avg(matches.map((m) => m.teamKills))

  // team kill penalty: subtract from support score
  const teamKillPenalty = Math.min(20, avgTeamKills * 10)
  const reviveScore = clampScore(avgRevives, MAX_REVIVES)
  const assistScore = clampScore(avgAssists, MAX_ASSISTS)
  const supportScore = Math.max(0, (reviveScore * 0.4 + assistScore * 0.35 + 25) - teamKillPenalty)

  const score = weightedScore([
    [reviveScore, 0.40],
    [assistScore, 0.35],
    [Math.max(0, 100 - teamKillPenalty * 5), 0.25],
  ])

  return {
    score,
    metrics: {
      avg_revives: avgRevives,
      avg_assists: avgAssists,
      avg_team_kills: avgTeamKills,
      support_score: supportScore,
    },
  }
}
