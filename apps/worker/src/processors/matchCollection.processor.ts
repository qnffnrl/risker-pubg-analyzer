import type { Job } from 'bullmq'
import { eq, gt, and, schema } from '@risker/db'
import type { MatchCollectionJob, AnalysisJob, ParticipantStats } from '@risker/shared'
import { PLATFORM_TO_SHARD } from '@risker/shared'
import { db } from '../lib/db.js'
import { PubgApiClient } from '../lib/pubg-client.js'
import { analysisQueue, telemetryFetchQueue } from '../queues/index.js'

const pubg = new PubgApiClient()

export async function matchCollectionProcessor(job: Job<MatchCollectionJob>): Promise<void> {
  const { playerId, pubgAccountId, platform, matchLimit, forceRefresh } = job.data
  const shard = PLATFORM_TO_SHARD[platform] ?? platform

  // Cache check
  if (!forceRefresh) {
    const cached = await db.query.playStyleAnalyses.findFirst({
      where: and(
        eq(schema.playStyleAnalyses.playerId, playerId),
        gt(schema.playStyleAnalyses.expiresAt, new Date()),
      ),
      columns: { id: true, expiresAt: true },
    })
    if (cached) {
      job.log(`Cache hit for player ${playerId}, expires ${cached.expiresAt.toISOString()}`)
      return
    }
  }

  // Fetch recent match IDs
  job.log(`Fetching up to ${matchLimit} matches for ${pubgAccountId}`)
  const matchIds = await pubg.getRecentMatchIds(shard, pubgAccountId, matchLimit)
  job.log(`Found ${matchIds.length} match IDs`)

  // Get all matchIds already stored for this player (join matches + playerMatchStats)
  const existingRows = await db
    .select({ pubgMatchId: schema.matches.pubgMatchId })
    .from(schema.playerMatchStats)
    .innerJoin(schema.matches, eq(schema.playerMatchStats.matchId, schema.matches.id))
    .where(eq(schema.playerMatchStats.playerId, playerId))
  const existingMatchIds = new Set(existingRows.map((r) => r.pubgMatchId))
  job.log(`Already have ${existingMatchIds.size} matches in DB, skipping those`)

  // Fetch each match and upsert
  let saved = 0
  for (const matchId of matchIds) {
    if (existingMatchIds.has(matchId)) continue
    try {
      const matchResponse = await pubg.getMatch(shard, matchId)
      const attr = matchResponse.data.attributes

      const [match] = await db
        .insert(schema.matches)
        .values({
          pubgMatchId: matchId,
          mapName: attr.mapName,
          mode: attr.gameMode,
          playedAt: new Date(attr.createdAt),
          durationSec: attr.duration,
          totalPlayers: matchResponse.included.filter((r) => r.type === 'participant').length,
          rawData: matchResponse.data as unknown as Record<string, unknown>,
          includedData: matchResponse.included as unknown as Record<string, unknown>[],
        })
        .onConflictDoUpdate({
          target: schema.matches.pubgMatchId,
          set: {
            rawData: matchResponse.data as unknown as Record<string, unknown>,
            includedData: matchResponse.included as unknown as Record<string, unknown>[],
          },
        })
        .returning()

      if (!match) continue

      // Find this player's stats in included
      const participant = matchResponse.included.find(
        (r) => r.type === 'participant' && r.attributes.stats.playerId === pubgAccountId,
      )
      if (!participant || participant.type !== 'participant') continue

      const stats: ParticipantStats = participant.attributes.stats

      await db
        .insert(schema.playerMatchStats)
        .values({
          playerId,
          matchId: match.id,
          placement: stats.winPlace,
          kills: stats.kills,
          assists: stats.assists,
          damageDealt: String(stats.damageDealt),
          headshotKills: stats.headshotKills,
          distanceOnFoot: String(stats.walkDistance),
          distanceInVehicle: String(stats.rideDistance),
          timeSurvived: stats.timeSurvived,
          boosts: stats.boosts,
          heals: stats.heals,
          weaponsAcquired: stats.weaponsAcquired,
          revives: stats.revives,
          teamKills: stats.teamKills,
          dbnos: stats.DBNOs,
          killStreaks: stats.killStreaks,
          swimDistance: String(stats.swimDistance),
          rawStats: stats as unknown as Record<string, unknown>,
        })
        .onConflictDoNothing()

      saved++

      // Enqueue telemetry fetch (best-effort, don't throw on failure)
      try {
        const asset = matchResponse.included.find((r) => r.type === 'asset')
        const telemetryUrl = asset?.type === 'asset' ? asset.attributes.URL : undefined
        if (telemetryUrl) {
          await telemetryFetchQueue.add(
            'fetch',
            { matchId: match.id, telemetryUrl },
            { jobId: `telemetry-${match.id}` },
          )
          job.log(`Telemetry job enqueued for match ${match.id}`)
        }
      } catch (telemetryErr) {
        job.log(`Failed to enqueue telemetry for match ${match.id}: ${String(telemetryErr)}`)
      }
    } catch (err) {
      job.log(`Failed to process match ${matchId}: ${String(err)}`)
    }
  }

  job.log(`Saved ${saved}/${matchIds.length} matches`)

  const analysisPayload: AnalysisJob = { playerId, pubgAccountId, platform }
  const analysisJobId = forceRefresh
    ? `analysis_${playerId}_${Date.now()}`
    : `analysis_${playerId}`
  await analysisQueue.add('analyze', analysisPayload, {
    jobId: analysisJobId,
  })
  job.log(`Analysis job enqueued for player ${playerId}`)
}
