import { Worker } from 'bullmq'
import { redisConnection } from '../redis.js'
import { telemetryFetchProcessor } from '../processors/telemetryFetch.processor.js'

export const telemetryFetchWorker = new Worker(
  'telemetry-fetch',
  async (job) => {
    await telemetryFetchProcessor(job)
  },
  {
    connection: redisConnection,
    concurrency: 4,
  },
)

telemetryFetchWorker.on('completed', (job) => {
  console.log(`[telemetry-fetch] Job ${job.id} completed`)
})

telemetryFetchWorker.on('failed', (job, err) => {
  console.error(`[telemetry-fetch] Job ${job?.id} failed:`, err.message)
})
