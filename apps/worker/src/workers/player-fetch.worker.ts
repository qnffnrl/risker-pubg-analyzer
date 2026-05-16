import { Worker } from 'bullmq'
import { QUEUE_NAMES, PlayerFetchJobSchema } from '@risker/shared'
import { redisConnection } from '../redis.js'
import { playerFetchProcessor } from '../processors/playerFetch.processor.js'

export const playerFetchWorker = new Worker(
  QUEUE_NAMES.PLAYER_FETCH,
  async (job) => {
    const data = PlayerFetchJobSchema.parse(job.data)
    job.data = data
    await playerFetchProcessor(job)
  },
  {
    connection: redisConnection,
    concurrency: 5,
  },
)

playerFetchWorker.on('completed', (job) => {
  console.log(`[player-fetch] Job ${job.id} completed`)
})

playerFetchWorker.on('failed', (job, err) => {
  console.error(`[player-fetch] Job ${job?.id} failed:`, err.message)
})
