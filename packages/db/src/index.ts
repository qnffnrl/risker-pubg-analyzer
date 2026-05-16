import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// DATABASE_URL must be set at runtime.
// We use a lazy getter to avoid failing at import time (useful for tests/build).
let _db: ReturnType<typeof drizzle<typeof schema>> | undefined

export function getDb() {
  if (_db) return _db

  const connectionString = process.env['DATABASE_URL']
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  const client = postgres(connectionString, { prepare: false })
  _db = drizzle(client, { schema })
  return _db
}

// Convenience export — resolves lazily at first use
export { schema }
export type { schema as Schema }

// Re-export drizzle helpers consumers might need
export { sql, eq, and, or, gt, gte, lt, lte, ne, desc, asc } from 'drizzle-orm'
