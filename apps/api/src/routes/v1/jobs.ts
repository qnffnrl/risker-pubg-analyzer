import { Hono } from 'hono'
import { Queue } from 'bullmq'
import { createSuccessResponse, createErrorResponse, QUEUE_NAMES } from '@risker/shared'
import { redisConnection } from '../../lib/redis.js'

const jobs = new Hono()

const playerFetchQueue = new Queue(QUEUE_NAMES.PLAYER_FETCH, { connection: redisConnection })
const matchCollectionQueue = new Queue(QUEUE_NAMES.MATCH_COLLECTION, { connection: redisConnection })
const analysisQueue = new Queue(QUEUE_NAMES.ANALYSIS, { connection: redisConnection })

async function getJobStatus(jobId: string) {
  for (const queue of [playerFetchQueue, matchCollectionQueue, analysisQueue]) {
    const job = await queue.getJob(jobId)
    if (!job) continue

    const state = await job.getState()
    const progress = typeof job.progress === 'number' ? job.progress : 0

    return {
      jobId,
      status: state as 'pending' | 'processing' | 'completed' | 'failed' | 'unknown',
      progress,
      result: state === 'completed' ? (job.returnvalue as Record<string, unknown> | null) : undefined,
      error: state === 'failed' ? job.failedReason : undefined,
    }
  }
  return null
}

// GET /api/v1/jobs/:jobId/status
jobs.get('/:jobId/status', async (c) => {
  const jobId = decodeURIComponent(c.req.param('jobId'))

  const status = await getJobStatus(jobId)
  if (!status) {
    return c.json(createErrorResponse('JOB_NOT_FOUND', 'Job not found'), 404)
  }

  return c.json(createSuccessResponse(status))
})

export { jobs }
