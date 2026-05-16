import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  PUBG_API_KEY: z.string().min(1),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  BULL_BOARD_PORT: z.coerce.number().int().positive().default(8082),
})

export const env = envSchema.parse(process.env)
export type Env = z.infer<typeof envSchema>
