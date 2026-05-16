import { Queue } from 'bullmq'
import { QUEUE_NAMES } from '@risker/shared'
import { redisConnection } from '../redis.js'

export const playerFetchQueue = new Queue(QUEUE_NAMES.PLAYER_FETCH, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
})

export const matchCollectionQueue = new Queue(QUEUE_NAMES.MATCH_COLLECTION, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
})

export const analysisQueue = new Queue(QUEUE_NAMES.ANALYSIS, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 25 },
  },
})

export const allQueues = [playerFetchQueue, matchCollectionQueue, analysisQueue]
