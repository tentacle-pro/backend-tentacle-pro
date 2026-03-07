import type { MiddlewareHandler } from 'hono'
import {
  findClientByKeyHash,
  findBindingByClientId,
} from '@tentacle-pro/db'
import { sha256Hex, AppError, ErrorCode } from '@tentacle-pro/core'

const BEARER_PREFIX = 'Bearer '

function extractApiKey(authHeader: string | undefined, apiKeyHeader: string | undefined): string | null {
  if (authHeader?.startsWith(BEARER_PREFIX)) {
    return authHeader.slice(BEARER_PREFIX.length).trim()
  }
  if (apiKeyHeader) return apiKeyHeader.trim()
  return null
}

/** 校验 API_KEY、解析客户端与绑定的公众号账号 */
export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const rawKey = extractApiKey(
    c.req.header('authorization'),
    c.req.header('x-api-key')
  )

  if (!rawKey) {
    throw new AppError(
      ErrorCode.AUTH_401_INVALID_API_KEY,
      'Missing API key',
      401
    )
  }

  const keyHash = await sha256Hex(rawKey)
  const client = await findClientByKeyHash(keyHash)

  if (!client || client.status !== 'active') {
    throw new AppError(
      ErrorCode.AUTH_401_INVALID_API_KEY,
      'Invalid or inactive API key',
      401
    )
  }

  const binding = await findBindingByClientId(client.id)

  if (!binding) {
    throw new AppError(
      ErrorCode.AUTH_403_BINDING_NOT_FOUND,
      'No WeChat account binding found for this API key',
      403
    )
  }

  c.set('clientId', client.id)
  c.set('clientName', client.name)
  c.set('wechatAccountId', binding.wechatAccountId)

  await next()
}
