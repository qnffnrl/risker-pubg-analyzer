import { z } from 'zod'

const SeasonAttributesSchema = z.object({
  isCurrentSeason: z.boolean(),
  isOffseason: z.boolean(),
})

const SeasonDataSchema = z.object({
  type: z.literal('season'),
  id: z.string(),
  attributes: SeasonAttributesSchema,
})

export const PubgSeasonsResponseSchema = z.object({
  data: z.array(SeasonDataSchema),
})

export type PubgSeason = z.infer<typeof SeasonDataSchema>
