import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import path from 'node:path'

async function runMigrations() {
  const url = process.env['DATABASE_URL']
  if (!url) throw new Error('DATABASE_URL is required')

  const client = postgres(url, { max: 1 })
  const db = drizzle(client)

  // __dirname works in CJS output (tsup cjs format)
  const migrationsFolder = path.resolve(__dirname, '../migrations')

  console.log('[db] Running migrations from', migrationsFolder)
  await migrate(db, { migrationsFolder })
  await client.end()
  console.log('[db] Migrations complete')
}

runMigrations().catch((err) => {
  console.error('[db] Migration failed:', err)
  process.exit(1)
})
