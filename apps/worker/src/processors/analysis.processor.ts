import type { Job } from 'bullmq'
import { eq, desc, schema } from '@risker/db'
import type { AnalysisJob } from '@risker/shared'
import { db } from '../lib/db.js'
import { analyzePlayStyle, type MatchRow } from '../lib/analysis/engine.js'
import { generateLlmSummary } from '../lib/llm.js'

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
      dbnos: schema.playerMatchStats.dbnos,
      killStreaks: schema.playerMatchStats.killStreaks,
      swimDistance: schema.playerMatchStats.swimDistance,
      placement: schema.playerMatchStats.placement,
      totalPlayers: schema.matches.totalPlayers,
      durationSec: schema.matches.durationSec,
    })
    .from(schema.playerMatchStats)
    .innerJoin(schema.matches, eq(schema.playerMatchStats.matchId, schema.matches.id))
    .where(eq(schema.playerMatchStats.playerId, playerId))
    .orderBy(desc(schema.matches.playedAt))

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
    dbnos: r.dbnos ?? 0,
    killStreaks: r.killStreaks ?? 0,
    swimDistance: Number(r.swimDistance ?? 0),
    placement: r.placement ?? 99,
    totalPlayers: r.totalPlayers ?? 100,
    durationSec: r.durationSec ?? 1800,
  }))

  const result = analyzePlayStyle(matchRows)

  // Compute v2 scores (Phase 1: aggregate-only, telemetry optional)
  const { calcSkill } = await import('../lib/analysis/metrics/skill.js')
  const { calcAggressionV2 } = await import('../lib/analysis/metrics/aggression.v2.js')
  const { calcSurvivalV2 } = await import('../lib/analysis/metrics/survival.v2.js')
  const { calcPositioningV2 } = await import('../lib/analysis/metrics/positioning.v2.js')
  const { calcTeamplayV2 } = await import('../lib/analysis/metrics/teamplay.v2.js')

  const skillResult = calcSkill(matchRows)
  const aggrV2 = calcAggressionV2(matchRows)
  const survV2 = calcSurvivalV2(matchRows)
  const posV2 = calcPositioningV2(matchRows)
  const teamV2 = calcTeamplayV2(matchRows)
  const scoreVersion = 'v1'  // Will be 'v2' when telemetry available — Phase 2

  job.log(`V2 scores: skill=${skillResult.score} aggr=${aggrV2.score} surv=${survV2.score} pos=${posV2.score} team=${teamV2.score}`)

  // Look up nickname for LLM prompt
  const [player] = await db
    .select({ nickname: schema.players.nickname })
    .from(schema.players)
    .where(eq(schema.players.id, playerId))
    .limit(1)

  job.log(`Generating LLM summary for ${player?.nickname ?? playerId}`)
  const llmSummary = await generateLlmSummary({
    nickname: player?.nickname ?? playerId,
    matchCount: result.matchCount,
    aggressionScore: result.aggressionScore,
    survivalScore: result.survivalScore,
    positioningScore: result.positioningScore,
    teamplayScore: result.teamplayScore,
    consistencyScore: result.consistencyScore,
    clutchScore: result.clutchScore,
    aggressionMetrics: result.aggressionMetrics as unknown as Record<string, number>,
    survivalMetrics: result.survivalMetrics as unknown as Record<string, number>,
    positioningMetrics: result.positioningMetrics as unknown as Record<string, number>,
    teamplayMetrics: result.teamplayMetrics as unknown as Record<string, number>,
    consistencyMetrics: result.consistencyMetrics as unknown as Record<string, number>,
    clutchMetrics: result.clutchMetrics as unknown as Record<string, number>,
  })
  job.log(`LLM summary: ${llmSummary ? llmSummary.slice(0, 80) + '…' : 'skipped'}`)

  const now = new Date()
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
      consistencyScore: String(result.consistencyScore),
      clutchScore: String(result.clutchScore),
      consistencyMetrics: result.consistencyMetrics as unknown as Record<string, unknown>,
      clutchMetrics: result.clutchMetrics as unknown as Record<string, unknown>,
      scoreVersion,
      aggressionScoreV2: String(aggrV2.score),
      survivalScoreV2: String(survV2.score),
      positioningScoreV2: String(posV2.score),
      teamplayScoreV2: String(teamV2.score),
      aggressionMetricsV2: aggrV2.metrics as unknown as Record<string, unknown>,
      survivalMetricsV2: survV2.metrics as unknown as Record<string, unknown>,
      positioningMetricsV2: posV2.metrics as unknown as Record<string, unknown>,
      teamplayMetricsV2: teamV2.metrics as unknown as Record<string, unknown>,
      skillScore: String(skillResult.score),
      llmSummary,
      llmGeneratedAt: llmSummary ? now : null,
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
        consistencyScore: String(result.consistencyScore),
        clutchScore: String(result.clutchScore),
        consistencyMetrics: result.consistencyMetrics as unknown as Record<string, unknown>,
        clutchMetrics: result.clutchMetrics as unknown as Record<string, unknown>,
        scoreVersion,
        aggressionScoreV2: String(aggrV2.score),
        survivalScoreV2: String(survV2.score),
        positioningScoreV2: String(posV2.score),
        teamplayScoreV2: String(teamV2.score),
        aggressionMetricsV2: aggrV2.metrics as unknown as Record<string, unknown>,
        survivalMetricsV2: survV2.metrics as unknown as Record<string, unknown>,
        positioningMetricsV2: posV2.metrics as unknown as Record<string, unknown>,
        teamplayMetricsV2: teamV2.metrics as unknown as Record<string, unknown>,
        skillScore: String(skillResult.score),
        llmSummary,
        llmGeneratedAt: llmSummary ? now : null,
        expiresAt,
        analyzedAt: now,
      },
    })

  job.log(`Analysis saved: aggression=${result.aggressionScore} survival=${result.survivalScore} positioning=${result.positioningScore} teamplay=${result.teamplayScore}`)
}
