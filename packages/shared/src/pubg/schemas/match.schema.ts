import { z } from 'zod'

// ── Participant stats ──────────────────────────────────────────────────────────

export const ParticipantStatsSchema = z.object({
  DBNOs: z.number(),
  assists: z.number(),
  boosts: z.number(),
  damageDealt: z.number(),
  deathType: z.string(),
  headshotKills: z.number(),
  heals: z.number(),
  killPlace: z.number(),
  killStreaks: z.number(),
  kills: z.number(),
  longestKill: z.number(),
  name: z.string(),
  playerId: z.string(),
  revives: z.number(),
  rideDistance: z.number(),
  roadKills: z.number(),
  swimDistance: z.number(),
  teamKills: z.number(),
  timeSurvived: z.number(),
  vehicleDestroys: z.number(),
  walkDistance: z.number(),
  weaponsAcquired: z.number(),
  winPlace: z.number(),
})

export type ParticipantStats = z.infer<typeof ParticipantStatsSchema>

// ── Included resource types ────────────────────────────────────────────────────

const ParticipantSchema = z.object({
  type: z.literal('participant'),
  id: z.string(),
  attributes: z.object({
    actor: z.string(),
    shardId: z.string(),
    stats: ParticipantStatsSchema,
  }),
})

const RosterAttributesSchema = z.object({
  shardId: z.string().optional(),
  won: z.union([z.literal('true'), z.literal('false'), z.boolean()]).optional(),
  stats: z.object({
    rank: z.number(),
    teamId: z.number(),
  }).optional(),
})

const RosterSchema = z.object({
  type: z.literal('roster'),
  id: z.string(),
  attributes: RosterAttributesSchema,
  relationships: z.object({
    participants: z.object({
      data: z.array(z.object({ type: z.literal('participant'), id: z.string() })),
    }),
  }),
})

const AssetSchema = z.object({
  type: z.literal('asset'),
  id: z.string(),
  attributes: z.object({
    URL: z.string(),
    createdAt: z.string(),
    name: z.string(),
    description: z.string().optional(),
  }),
})

// ── Match data ─────────────────────────────────────────────────────────────────

const MatchAttributesSchema = z.object({
  createdAt: z.string(),
  duration: z.number(),
  gameMode: z.string(),
  mapName: z.string(),
  isCustomMatch: z.boolean().optional(),
  seasonState: z.string().optional(),
  shardId: z.string(),
  titleId: z.string().optional(),
  tags: z.record(z.unknown()).nullable().optional(),
  stats: z.unknown().nullable().optional(),
  matchType: z.string().optional(),
})

const MatchDataSchema = z.object({
  type: z.literal('match'),
  id: z.string(),
  attributes: MatchAttributesSchema,
  relationships: z.object({
    rosters: z.object({
      data: z.array(z.object({ type: z.literal('roster'), id: z.string() })),
    }),
    assets: z.object({
      data: z.array(z.object({ type: z.literal('asset'), id: z.string() })),
    }).optional(),
  }),
})

const IncludedItemSchema = z.discriminatedUnion('type', [
  ParticipantSchema,
  RosterSchema,
  AssetSchema,
])

export const PubgMatchResponseSchema = z.object({
  data: MatchDataSchema,
  included: z.array(IncludedItemSchema),
})

export type PubgMatchResponse = z.infer<typeof PubgMatchResponseSchema>
export type PubgMatchData = z.infer<typeof MatchDataSchema>
