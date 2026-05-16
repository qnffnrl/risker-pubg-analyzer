import { z } from 'zod'

const WeaponSummarySchema = z.object({
  XPTotal: z.number().default(0),
  LevelCurrent: z.number().default(0),
  TierCurrent: z.number().default(0),
  StatsTotal: z.object({
    Kills: z.number().default(0),
    DamagePlayer: z.number().default(0),
    HeadShots: z.number().default(0),
    Groggies: z.number().default(0),
    Assists: z.number().default(0),
    LongestKill: z.number().default(0),
    Shots: z.number().optional(),
    Hits: z.number().optional(),
  }).passthrough(),
}).passthrough()

const WeaponMasteryAttributesSchema = z.object({
  weaponSummaries: z.record(WeaponSummarySchema),
})

const WeaponMasteryDataSchema = z.object({
  type: z.literal('weaponMasterySummary'),
  attributes: WeaponMasteryAttributesSchema,
})

export const PubgWeaponMasteryResponseSchema = z.object({
  data: WeaponMasteryDataSchema,
})

export type PubgWeaponMastery = z.infer<typeof WeaponMasteryDataSchema>
export type WeaponSummary = z.infer<typeof WeaponSummarySchema>
