import { z } from 'zod'

const GameModeStatsSchema = z.object({
  assists: z.number(),
  boosts: z.number(),
  dBNOs: z.number(),
  dailyKills: z.number().optional(),
  dailyWins: z.number().optional(),
  damageDealt: z.number(),
  days: z.number(),
  headshotKills: z.number(),
  heals: z.number(),
  killPoints: z.number().optional(),
  kills: z.number(),
  longestKill: z.number(),
  longestTimeSurvived: z.number(),
  losses: z.number(),
  maxKillStreaks: z.number(),
  mostSurvivalTime: z.number(),
  rankPoints: z.number().optional(),
  rankPointsTitle: z.string().optional(),
  revives: z.number(),
  rideDistance: z.number(),
  roadKills: z.number(),
  roundMostKills: z.number(),
  roundsPlayed: z.number(),
  suicides: z.number(),
  swimDistance: z.number(),
  teamKills: z.number(),
  timeSurvived: z.number(),
  top10s: z.number(),
  vehicleDestroys: z.number(),
  walkDistance: z.number(),
  weaponsAcquired: z.number(),
  weeklyKills: z.number().optional(),
  weeklyWins: z.number().optional(),
  winPoints: z.number().optional(),
  wins: z.number(),
})

export type GameModeStats = z.infer<typeof GameModeStatsSchema>

const SeasonStatsAttributesSchema = z.object({
  gameModeStats: z.record(GameModeStatsSchema),
})

const SeasonStatsDataSchema = z.object({
  type: z.literal('playerSeason'),
  attributes: SeasonStatsAttributesSchema,
})

export const PubgSeasonStatsResponseSchema = z.object({
  data: SeasonStatsDataSchema,
})

export type PubgSeasonStats = z.infer<typeof SeasonStatsDataSchema>
