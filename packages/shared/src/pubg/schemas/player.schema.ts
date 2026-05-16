import { z } from 'zod'

const PubgPlayerAttributesSchema = z.object({
  name: z.string(),
  titleId: z.string().optional(),
  shardId: z.string().optional(),
  patchVersion: z.string().optional(),
  banType: z.string().optional(),
  clanId: z.string().optional(),
})

const PubgMatchRefSchema = z.object({
  type: z.literal('match'),
  id: z.string(),
})

const PubgPlayerRelationshipsSchema = z.object({
  matches: z.object({
    data: z.array(PubgMatchRefSchema),
  }),
  assets: z.object({ data: z.array(z.unknown()) }).optional(),
})

export const PubgPlayerDataSchema = z.object({
  type: z.literal('player'),
  id: z.string(),
  attributes: PubgPlayerAttributesSchema,
  relationships: PubgPlayerRelationshipsSchema,
})

// GET /players?filter[playerNames]=... returns { data: [...] }
export const PubgPlayersResponseSchema = z.object({
  data: z.array(PubgPlayerDataSchema),
})

// GET /players/{accountId} returns { data: {...} }
export const PubgPlayerResponseSchema = z.object({
  data: PubgPlayerDataSchema,
})

export type PubgPlayerData = z.infer<typeof PubgPlayerDataSchema>
