export const QUEUE_NAMES = {
  PLAYER_FETCH: 'player-fetch',
  MATCH_COLLECTION: 'match-collection',
  ANALYSIS: 'analysis',
} as const

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES]
