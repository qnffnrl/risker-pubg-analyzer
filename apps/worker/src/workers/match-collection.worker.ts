import { Worker } from 'bullmq'
import { QUEUE_NAMES, MatchCollectionJobSchema } from '@risker/shared'
import { redisConnection } from '../redis.js'
import { matchCollectionProcessor } from '../processors/matchCollection.processor.js'

export const matchCollectionWorker = new Worker(
  QUEUE_NAMES.MATCH_COLLECTION,
  async (job) => {
    const data = MatchCollectionJobSchema.parse(job.data)
    job.data = data
    await matchCollectionProcessor(job)
  },
  {
    connection: redisConnection,
    concurrency: 2,
  },
)

matchCollectionWorker.on('completed', (job) => {
  console.log(`[match-collection] Job ${job.id} completed`)
})

matchCollectionWorker.on('failed', (job, err) => {
  console.error(`[match-collection] Job ${job?.id} failed:`, err.message)
})
