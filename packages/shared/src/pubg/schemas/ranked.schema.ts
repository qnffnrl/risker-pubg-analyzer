import { z } from 'zod'

export const RankedTierSchema = z.object({
  tier: z.string(),
  subTier: z.string(),
})

export const RankedGameModeStatsSchema = z.object({
  currentTier: RankedTierSchema,
  currentRankPoint: z.number(),
  bestTier: RankedTierSchema,
  bestRankPoint: z.number(),
  roundsPlayed: z.number(),
  wins: z.number(),
  winRatio: z.number(),
  kills: z.number(),
  deaths: z.number().optional(),
  kda: z.number(),
  kdr: z.number().optional(),
  damageDealt: z.number(),
  avgRank: z.number(),
  avgSurvivalTime: z.number().optional(),
  top10Ratio: z.number().optional(),
  headshotKills: z.number().optional(),
  headshotKillRatio: z.number().optional(),
  dBNOs: z.number().optional(),
  revives: z.number().optional(),
  reviveRatio: z.number().optional(),
  roundMostKills: z.number().optional(),
  longestKill: z.number().optional(),
}).passthrough()

const RankedStatsAttributesSchema = z.object({
  rankedGameModeStats: z.record(RankedGameModeStatsSchema),
})

const RankedStatsDataSchema = z.object({
  type: z.literal('rankedplayerstats'),
  attributes: RankedStatsAttributesSchema,
})

export const PubgRankedStatsResponseSchema = z.object({
  data: RankedStatsDataSchema,
})

export type RankedTier = z.infer<typeof RankedTierSchema>
export type RankedGameModeStats = z.infer<typeof RankedGameModeStatsSchema>
export type PubgRankedStats = z.infer<typeof RankedStatsDataSchema>
