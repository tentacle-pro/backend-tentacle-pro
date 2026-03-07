import {
  findTokenByAccountId,
  upsertToken,
  findWechatAccount,
} from '@tentacle-pro/db'
import { encrypt, decrypt, AppError, ErrorCode } from '@tentacle-pro/core'
import type { WxTokenResponse } from './types'
import { WX_ERRCODE } from './types'

const WX_TOKEN_URL = 'https://api.weixin.qq.com/cgi-bin/token'
/** token 剩余有效期 < 此值时触发后台刷新（毫秒） */
const REFRESH_AHEAD_MS = 10 * 60 * 1000

// ─── 内部辅助 ──────────────────────────────────────────────────────────────

async function fetchTokenFromWechat(
  appId: string,
  appSecret: string
): Promise<{ accessToken: string; expiresAt: Date }> {
  const url = new URL(WX_TOKEN_URL)
  url.searchParams.set('grant_type', 'client_credential')
  url.searchParams.set('appid', appId)
  url.searchParams.set('secret', appSecret)

  const resp = await fetch(url.toString())
  if (!resp.ok) {
    throw new AppError(
      ErrorCode.WX_401_TOKEN_INVALID,
      `WeChat token fetch HTTP error: ${resp.status}`,
      502
    )
  }

  const body = (await resp.json()) as WxTokenResponse
  if (body.errcode && body.errcode !== WX_ERRCODE.OK) {
    throw new AppError(
      ErrorCode.WX_401_TOKEN_INVALID,
      `WeChat token error ${body.errcode}: ${body.errmsg}`,
      502
    )
  }

  const expiresAt = new Date(Date.now() + body.expires_in * 1000)
  return { accessToken: body.access_token, expiresAt }
}

/** 后台异步刷新（不阻塞主请求） */
function scheduleBackgroundRefresh(wechatAccountId: string): void {
  Promise.resolve()
    .then(() => forceRefreshToken(wechatAccountId))
    .catch((err) => {
      console.error(
        JSON.stringify({
          level: 'error',
          event: 'background_token_refresh_failed',
          wechatAccountId,
          error: String(err),
        })
      )
    })
}

// ─── 公开 API ──────────────────────────────────────────────────────────────

/**
 * 获取有效的 access_token
 * - 命中有效 token → 直接返回
 * - 即将过期（<10 分钟）→ 返回当前 token 并后台刷新
 * - 已过期 → 强制同步刷新后返回
 */
export async function getAccessToken(wechatAccountId: string): Promise<string> {
  const row = await findTokenByAccountId(wechatAccountId)
  const now = Date.now()

  if (row) {
    const ttlMs = row.expiresAt.getTime() - now
    if (ttlMs > 0) {
      const token = await decrypt(row.accessTokenEncrypted)
      if (ttlMs < REFRESH_AHEAD_MS) {
        scheduleBackgroundRefresh(wechatAccountId)
      }
      return token
    }
  }

  // 过期或不存在：同步刷新
  return forceRefreshToken(wechatAccountId)
}

/**
 * 强制刷新 token
 */
export async function forceRefreshToken(
  wechatAccountId: string
): Promise<string> {
  const account = await findWechatAccount(wechatAccountId)
  if (!account) {
    throw new AppError(
      ErrorCode.AUTH_403_BINDING_NOT_FOUND,
      `WeChat account not found: ${wechatAccountId}`,
      404
    )
  }

  const appSecret = await decrypt(account.appSecretEncrypted)
  const { accessToken, expiresAt } = await fetchTokenFromWechat(
    account.appId,
    appSecret
  )
  const accessTokenEncrypted = await encrypt(accessToken)

  await upsertToken({ wechatAccountId, accessTokenEncrypted, expiresAt })

  return accessToken
}
