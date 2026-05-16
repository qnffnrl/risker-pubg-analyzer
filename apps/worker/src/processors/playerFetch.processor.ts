import type { Job } from 'bullmq'
import { schema } from '@risker/db'
import type { PlayerFetchJob, MatchCollectionJob } from '@risker/shared'
import { PLATFORM_TO_SHARD } from '@risker/shared'
import { db } from '../lib/db.js'
import { PubgApiClient } from '../lib/pubg-client.js'
import { matchCollectionQueue } from '../queues/index.js'

const pubg = new PubgApiClient()

export async function playerFetchProcessor(job: Job<PlayerFetchJob>): Promise<void> {
  const { nickname, platform } = job.data
  const shard = PLATFORM_TO_SHARD[platform] ?? platform

  job.log(`Fetching player: ${nickname} on ${shard}`)

  const playerData = await pubg.getPlayerByName(shard, nickname)
  const pubgAccountId = playerData.id

  // Upsert player
  const [player] = await db
    .insert(schema.players)
    .values({
      pubgId: pubgAccountId,
      nickname: playerData.attributes.name,
      platform,
      lastFetchedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.players.pubgId,
      set: {
        nickname: playerData.attributes.name,
        lastFetchedAt: new Date(),
        updatedAt: new Date(),
      },
    })
    .returning()

  if (!player) throw new Error('Failed to upsert player')

  job.log(`Player upserted: ${player.id}`)

  // Enqueue match collection
  const matchCollectionPayload: MatchCollectionJob = {
    playerId: player.id,
    pubgAccountId,
    platform,
    matchLimit: 20,
    forceRefresh: job.data.forceRefresh ?? false,
  }
  // forceRefresh 시 unique jobId로 BullMQ 중복 방지 우회
  const matchJobId = matchCollectionPayload.forceRefresh
    ? `match-collection_${player.id}_${Date.now()}`
    : `match-collection_${player.id}`

  await matchCollectionQueue.add('collect', matchCollectionPayload, {
    jobId: matchJobId,
  })

  job.log(`Match collection job enqueued for player ${player.id}`)
}
