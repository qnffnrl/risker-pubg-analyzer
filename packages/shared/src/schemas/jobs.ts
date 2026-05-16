import { z } from 'zod'
import { PlatformSchema } from './player'

export const PlayerFetchJobSchema = z.object({
  nickname: z.string().min(1),
  platform: PlatformSchema,
  requestedAt: z.string().datetime(),
  forceRefresh: z.boolean().default(false),
})
export type PlayerFetchJob = z.infer<typeof PlayerFetchJobSchema>

export const MatchCollectionJobSchema = z.object({
  playerId: z.string().uuid(),
  pubgAccountId: z.string(),
  platform: PlatformSchema,
  matchLimit: z.number().int().positive().default(20),
  forceRefresh: z.boolean().default(false),
})
export type MatchCollectionJob = z.infer<typeof MatchCollectionJobSchema>

export const AnalysisJobSchema = z.object({
  playerId: z.string().uuid(),
  pubgAccountId: z.string(),
  platform: PlatformSchema,
})
export type AnalysisJob = z.infer<typeof AnalysisJobSchema>
