import type { Job } from 'bullmq'
import { eq, gt, and, schema } from '@risker/db'
import type { MatchCollectionJob, AnalysisJob, ParticipantStats } from '@risker/shared'
import { PLATFORM_TO_SHARD } from '@risker/shared'
import { db } from '../lib/db.js'
import { PubgApiClient } from '../lib/pubg-client.js'
import { analysisQueue } from '../queues/index.js'

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

  // Fetch each match and upsert
  let saved = 0
  for (const matchId of matchIds) {
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
        })
        .onConflictDoUpdate({
          target: schema.matches.pubgMatchId,
          set: { rawData: matchResponse.data as unknown as Record<string, unknown> },
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
          rawStats: stats as unknown as Record<string, unknown>,
        })
        .onConflictDoNothing()

      saved++
    } catch (err) {
      job.log(`Failed to process match ${matchId}: ${String(err)}`)
    }
  }

  job.log(`Saved ${saved}/${matchIds.length} matches`)

  const analysisPayload: AnalysisJob = { playerId, pubgAccountId, platform }
  await analysisQueue.add('analyze', analysisPayload, {
    jobId: `analysis_${playerId}`,
  })
  job.log(`Analysis job enqueued for player ${playerId}`)
}
