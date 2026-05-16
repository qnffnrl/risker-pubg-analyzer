import { Worker } from 'bullmq'
import { QUEUE_NAMES } from '@risker/shared'
import { redisConnection } from '../redis.js'

// Actual job processing logic will be implemented in T-005
export const matchCollectionWorker = new Worker(
  QUEUE_NAMES.MATCH_COLLECTION,
  async (job) => {
    console.log(`[worker] Processing job ${job.id} in queue ${QUEUE_NAMES.MATCH_COLLECTION}`)
    console.log('[worker] Job data:', job.data)
    // TODO: Implement in T-005
  },
  {
    connection: redisConnection,
    concurrency: 3,
  },
)

matchCollectionWorker.on('completed', (job) => {
  console.log(`[worker] Job ${job.id} completed`)
})

matchCollectionWorker.on('failed', (job, err) => {
  console.error(`[worker] Job ${job?.id} failed:`, err)
})
