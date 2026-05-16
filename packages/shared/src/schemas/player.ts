import { z } from 'zod'

export const PlatformSchema = z.enum([
  'steam',
  'psn',
  'xbox',
  'kakao',
  'stadia',
  'tournament',
])

export type Platform = z.infer<typeof PlatformSchema>

export const PlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  platform: PlatformSchema,
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
})

export type Player = z.infer<typeof PlayerSchema>

export const PlayerSearchRequestSchema = z.object({
  name: z.string().min(1).max(64),
  platform: PlatformSchema.default('steam'),
})

export type PlayerSearchRequest = z.infer<typeof PlayerSearchRequestSchema>
