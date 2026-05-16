import { Queue } from 'bullmq'
import IORedis from 'ioredis'
import { QUEUE_NAMES } from '@risker/shared'
import type { PlayerFetchJob } from '@risker/shared'

export const redisConnection = new IORedis(process.env['REDIS_URL'] ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

export const playerFetchQueue = new Queue<PlayerFetchJob>(QUEUE_NAMES.PLAYER_FETCH, {
  connection: redisConnection,
})
