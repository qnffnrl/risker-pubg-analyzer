import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import path from 'node:path'

async function runMigrations() {
  const url = process.env['DATABASE_URL']
  if (!url) throw new Error('DATABASE_URL is required')

  const client = postgres(url, { max: 1 })
  const db = drizzle(client)

  // MIGRATIONS_DIR env var takes precedence (for Docker deployments where pnpm deploy
  // may not bundle the migrations folder alongside dist/)
  const migrationsFolder = process.env['MIGRATIONS_DIR'] ?? path.resolve(__dirname, '../migrations')

  console.log('[db] Running migrations from', migrationsFolder)
  await migrate(db, { migrationsFolder })
  await client.end()
  console.log('[db] Migrations complete')
}

runMigrations().catch((err) => {
  console.error('[db] Migration failed:', err)
  process.exit(1)
})
