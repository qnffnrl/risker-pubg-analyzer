import type { Config } from 'drizzle-kit'

export default {
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  // dbCredentials only required for migrate/push/studio, not generate
  ...(process.env['DATABASE_URL']
    ? { dbCredentials: { url: process.env['DATABASE_URL'] } }
    : {}),
} satisfies Config
