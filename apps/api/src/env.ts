import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().default(8081),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PUBG_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
})

export const env = envSchema.parse(process.env)
export type Env = z.infer<typeof envSchema>
