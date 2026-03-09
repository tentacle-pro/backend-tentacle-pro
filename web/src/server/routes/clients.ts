import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import {
  createApiClient,
  createWechatAccount,
  createClientAccountBinding,
  findClientByKeyHash,
} from '@tentacle-pro/db'
import { encrypt, sha256Hex } from '@tentacle-pro/core'
import { requireAdmin } from '../auth'

function genId(): string {
  return crypto.randomUUID().replaceAll('-', '').slice(0, 21)
}

const createClientSchema = z.object({
  /** 客户端 ID，即客户端 APP_ID，建议用简短英文标识符，如 "corp-a" */
  client_id: z
    .string()
    .min(3)
    .max(64)
    .regex(/^[a-z0-9_-]+$/, 'Only lowercase letters, digits, _ and - are allowed'),
  /** 客户端显示名称 */
  client_name: z.string().min(1).max(128),
  /**
   * 客户端的原始 API Secret（即客户端填入 APP_SECRET 的值）
   * 服务端会计算 sha256 后存储，明文不落库
   */
  api_secret: z.string().min(16),
  /** 微信公众号 APP_ID（wx 开头的字符串） */
  wechat_app_id: z.string().min(1),
  /**
   * 微信公众号 APP_SECRET（明文）
   * 服务端会用 AES-GCM 加密后存储，明文不落库
   */
  wechat_app_secret: z.string().min(1),
  /** 公众号名称（仅用于内部标识） */
  account_name: z.string().min(1).max(128),
})

export const adminClientsApp = new Hono()

// All routes require admin JWT cookie
adminClientsApp.use('*', requireAdmin)

/**
 * POST /admin/clients
 * 创建一个完整的客户记录：api_client + wechat_account + binding
 * 输入明文 api_secret 和 wechat_app_secret，服务端加密后存库
 */
adminClientsApp.post(
  '/',
  zValidator('json', createClientSchema),
  async (c) => {
    const body = c.req.valid('json')

    // 检查 client_id 是否已存在（避免 PK 冲突）
    const apiKeyHash = await sha256Hex(body.api_secret)
    const existing = await findClientByKeyHash(apiKeyHash)
    if (existing) {
      return c.json(
        { ok: false, error: { message: 'A client with this api_secret already exists' } },
        409
      )
    }

    // 加密微信 APP_SECRET（AES-GCM，密钥来自 ENCRYPTION_KEY 环境变量）
    const appSecretEncrypted = await encrypt(body.wechat_app_secret)

    const wechatAccountId = genId()
    const bindingId = genId()

    // 写库：三张表
    await createApiClient({
      id: body.client_id,
      name: body.client_name,
      apiKeyHash,
    })

    await createWechatAccount({
      id: wechatAccountId,
      appId: body.wechat_app_id,
      appSecretEncrypted,
      accountName: body.account_name,
    })

    await createClientAccountBinding({
      id: bindingId,
      clientId: body.client_id,
      wechatAccountId,
    })

    return c.json(
      {
        ok: true,
        data: {
          client_id: body.client_id,
          wechat_account_id: wechatAccountId,
          binding_id: bindingId,
        },
      },
      201
    )
  }
)
