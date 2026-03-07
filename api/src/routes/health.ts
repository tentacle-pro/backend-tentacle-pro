import { Hono } from 'hono'
import { checkDbConnection } from '@tentacle-pro/db'

export const healthRouter = new Hono()

/** GET /healthz — 进程存活检查 */
healthRouter.get('/healthz', (c) => {
  return c.json({ ok: true, status: 'alive', ts: new Date().toISOString() })
})

/** GET /readyz — 依赖就绪检查（含数据库） */
healthRouter.get('/readyz', async (c) => {
  const dbOk = await checkDbConnection()
  const status = dbOk ? 200 : 503
  return c.json(
    {
      ok: dbOk,
      checks: {
        database: dbOk ? 'ok' : 'unavailable',
      },
      ts: new Date().toISOString(),
    },
    status
  )
})
