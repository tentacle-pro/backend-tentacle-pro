import type { MiddlewareHandler } from 'hono'
import { getDb, publishAuditLogs } from '@tentacle-pro/db'

/**
 * 审计日志中间件
 * 在响应完成后异步写入 publish_audit_logs
 * 日志内容全程脱敏（不含 API_KEY、token、app_secret）
 */
export const auditMiddleware: MiddlewareHandler = async (c, next) => {
  const startMs = Date.now()
  await next()
  const latencyMs = Date.now() - startMs

  // 异步写入，不影响主响应
  Promise.resolve().then(async () => {
    try {
      const db = getDb()
      const id = crypto.randomUUID()
      await db.insert(publishAuditLogs).values({
        id,
        requestId: c.get('requestId') ?? id,
        clientId: c.get('clientId') ?? null,
        endpoint: c.req.path,
        method: c.req.method,
        payloadDigest: null, // 可按需计算 body hash
        resultStatus: c.res.status,
        errorCode: null,
        latencyMs,
      })
    } catch (err) {
      // 审计失败不影响主业务，只打日志
      console.error(
        JSON.stringify({
          level: 'error',
          event: 'audit_log_write_failed',
          error: String(err),
        })
      )
    }
  })
}
