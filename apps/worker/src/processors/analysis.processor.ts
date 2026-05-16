import type { Job } from 'bullmq'
import { eq, desc, schema } from '@risker/db'
import type { AnalysisJob } from '@risker/shared'
import { db } from '../lib/db.js'
import { analyzePlayStyle, type MatchRow } from '../lib/analysis/engine.js'

const CACHE_TTL_HOURS = Number(process.env['ANALYSIS_CACHE_TTL_HOURS'] ?? 24)

export async function analysisProcessor(job: Job<AnalysisJob>): Promise<void> {
  const { playerId } = job.data

  // Load player match stats from DB
  const rows = await db
    .select({
      kills: schema.playerMatchStats.kills,
      assists: schema.playerMatchStats.assists,
      damageDealt: schema.playerMatchStats.damageDealt,
      headshotKills: schema.playerMatchStats.headshotKills,
      distanceOnFoot: schema.playerMatchStats.distanceOnFoot,
      distanceInVehicle: schema.playerMatchStats.distanceInVehicle,
      timeSurvived: schema.playerMatchStats.timeSurvived,
      boosts: schema.playerMatchStats.boosts,
      heals: schema.playerMatchStats.heals,
      weaponsAcquired: schema.playerMatchStats.weaponsAcquired,
      revives: schema.playerMatchStats.revives,
      teamKills: schema.playerMatchStats.teamKills,
      placement: schema.playerMatchStats.placement,
      totalPlayers: schema.matches.totalPlayers,
      durationSec: schema.matches.durationSec,
    })
    .from(schema.playerMatchStats)
    .innerJoin(schema.matches, eq(schema.playerMatchStats.matchId, schema.matches.id))
    .where(eq(schema.playerMatchStats.playerId, playerId))
    .orderBy(desc(schema.matches.playedAt))
    .limit(20)

  job.log(`Loaded ${rows.length} match stats for player ${playerId}`)

  const matchRows: MatchRow[] = rows.map((r) => ({
    kills: r.kills ?? 0,
    assists: r.assists ?? 0,
    damageDealt: Number(r.damageDealt ?? 0),
    headshotKills: r.headshotKills ?? 0,
    distanceOnFoot: Number(r.distanceOnFoot ?? 0),
    distanceInVehicle: Number(r.distanceInVehicle ?? 0),
    timeSurvived: r.timeSurvived ?? 0,
    boosts: r.boosts ?? 0,
    heals: r.heals ?? 0,
    weaponsAcquired: r.weaponsAcquired ?? 0,
    revives: r.revives ?? 0,
    teamKills: r.teamKills ?? 0,
    placement: r.placement ?? 99,
    totalPlayers: r.totalPlayers ?? 100,
    durationSec: r.durationSec ?? 1800,
  }))

  const result = analyzePlayStyle(matchRows)

  const expiresAt = new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000)

  await db
    .insert(schema.playStyleAnalyses)
    .values({
      playerId,
      matchCount: result.matchCount,
      aggressionScore: String(result.aggressionScore),
      survivalScore: String(result.survivalScore),
      positioningScore: String(result.positioningScore),
      teamplayScore: String(result.teamplayScore),
      aggressionMetrics: result.aggressionMetrics as unknown as Record<string, unknown>,
      survivalMetrics: result.survivalMetrics as unknown as Record<string, unknown>,
      positioningMetrics: result.positioningMetrics as unknown as Record<string, unknown>,
      teamplayMetrics: result.teamplayMetrics as unknown as Record<string, unknown>,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: schema.playStyleAnalyses.playerId,
      set: {
        matchCount: result.matchCount,
        aggressionScore: String(result.aggressionScore),
        survivalScore: String(result.survivalScore),
        positioningScore: String(result.positioningScore),
        teamplayScore: String(result.teamplayScore),
        aggressionMetrics: result.aggressionMetrics as unknown as Record<string, unknown>,
        survivalMetrics: result.survivalMetrics as unknown as Record<string, unknown>,
        positioningMetrics: result.positioningMetrics as unknown as Record<string, unknown>,
        teamplayMetrics: result.teamplayMetrics as unknown as Record<string, unknown>,
        expiresAt,
        analyzedAt: new Date(),
      },
    })

  job.log(`Analysis saved: aggression=${result.aggressionScore} survival=${result.survivalScore} positioning=${result.positioningScore} teamplay=${result.teamplayScore}`)
}
