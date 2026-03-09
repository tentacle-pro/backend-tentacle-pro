import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'

import type { AppVariables } from './types'
import { requestIdMiddleware } from './middleware/request-id'
import { authMiddleware } from './middleware/auth'
import { auditMiddleware } from './middleware/audit'
import { errorHandler } from './middleware/error-handler'

import { healthRouter } from './routes/health'
import { markdown2htmlRouter } from './routes/markdown2html'
import { uploadRouter } from './routes/upload'
import { draftRouter } from './routes/draft'
import { templatesRouter } from './routes/templates'
import { assetsRouter } from './routes/assets'

const app = new Hono<{ Variables: AppVariables }>()

// ─── 全局中间件 ────────────────────────────────────────────────
app.use('*', requestIdMiddleware)
app.use('*', logger())
app.use('*', secureHeaders())
app.use(
  '*',
  cors({
    origin: process.env.CORS_ORIGIN ?? '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  })
)

// ─── 健康检查（无需鉴权）─────────────────────────────────────
app.route('', healthRouter)

// ─── 需要鉴权的路由 ────────────────────────────────────────────
const v1 = new Hono<{ Variables: AppVariables }>()
v1.use('*', authMiddleware)
v1.use('*', auditMiddleware)

v1.route('/markdown2html', markdown2htmlRouter)
v1.route('/templates', templatesRouter)
v1.route('/assets', assetsRouter)
v1.route('/post2wechat/upload', uploadRouter)
v1.route('/post2wechat/draft', draftRouter)

app.route('', v1)

// ─── 全局错误处理 ──────────────────────────────────────────────
app.onError(errorHandler)

// ─── 404 ────────────────────────────────────────────────────
app.notFound((c) => {
  return c.json(
    {
      ok: false,
      request_id: c.get('requestId') ?? '',
      error: { code: 'NOT_FOUND', message: `Route ${c.req.path} not found` },
    },
    404
  )
})

const PORT = Number(process.env.API_PORT ?? 3001)

console.log(
  JSON.stringify({
    level: 'info',
    event: 'server_start',
    port: PORT,
    env: process.env.NODE_ENV ?? 'development',
  })
)

export default {
  port: PORT,
  fetch: app.fetch,
}
