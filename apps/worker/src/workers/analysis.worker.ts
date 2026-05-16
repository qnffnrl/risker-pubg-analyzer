import { Worker } from 'bullmq'
import { QUEUE_NAMES, AnalysisJobSchema } from '@risker/shared'
import { redisConnection } from '../redis.js'
import { analysisProcessor } from '../processors/analysis.processor.js'

export const analysisWorker = new Worker(
  QUEUE_NAMES.ANALYSIS,
  async (job) => {
    const data = AnalysisJobSchema.parse(job.data)
    job.data = data
    await analysisProcessor(job)
  },
  {
    connection: redisConnection,
    concurrency: 4,
  },
)

analysisWorker.on('completed', (job) => {
  console.log(`[analysis] Job ${job.id} completed`)
})

analysisWorker.on('failed', (job, err) => {
  console.error(`[analysis] Job ${job?.id} failed:`, err.message)
})
