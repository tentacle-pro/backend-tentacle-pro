import { drizzle } from 'drizzle-orm/postgres-js'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

export type Db = PostgresJsDatabase<typeof schema>

let _client: Db | null = null

function buildConnectionString(): string {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL environment variable is not set')
  return url
}

export function getDb(): Db {
  if (!_client) {
    const pg = postgres(buildConnectionString(), {
      max: 10,
      idle_timeout: 30,
    })
    _client = drizzle(pg, { schema })
  }
  return _client
}

/** 健康检查：简单 SELECT 1 */
export async function checkDbConnection(): Promise<boolean> {
  try {
    const pg = postgres(buildConnectionString(), { max: 1 })
    await pg`SELECT 1`
    await pg.end()
    return true
  } catch {
    return false
  }
}
