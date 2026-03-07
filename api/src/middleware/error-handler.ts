import type { ErrorHandler } from 'hono'
import { AppError, ErrorCode } from '@tentacle-pro/core'
import type { ApiResponse } from '@tentacle-pro/core'

export const errorHandler: ErrorHandler = (err, c) => {
  const requestId = c.get('requestId') ?? 'unknown'

  // 结构化错误日志（脱敏）
  console.error(
    JSON.stringify({
      level: 'error',
      request_id: requestId,
      client_id: c.get('clientId') ?? null,
      endpoint: c.req.path,
      error_name: err.name,
      error_message: err.message,
      // 不输出 stack 到生产日志，仅开发模式
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    })
  )

  if (err instanceof AppError) {
    const body: ApiResponse = {
      ok: false,
      request_id: requestId,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    }
    return c.json(body, err.httpStatus as 400 | 401 | 403 | 404 | 429 | 500 | 502)
  }

  const body: ApiResponse = {
    ok: false,
    request_id: requestId,
    error: {
      code: ErrorCode.SYS_500_INTERNAL_ERROR,
      message: 'An unexpected error occurred',
    },
  }
  return c.json(body, 500)
}
