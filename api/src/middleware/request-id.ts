import type { MiddlewareHandler } from 'hono'
import { generateRequestId } from '@tentacle-pro/core'

/** 为每个请求注入 X-Request-Id，并挂载到 context */
export const requestIdMiddleware: MiddlewareHandler = async (c, next) => {
  const reqId =
    c.req.header('x-request-id') ?? generateRequestId()
  c.set('requestId', reqId)
  c.header('X-Request-Id', reqId)
  await next()
}
