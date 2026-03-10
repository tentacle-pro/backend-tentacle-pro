import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import {
  createApiClient,
  createWechatAccount,
  createClientAccountBinding,
  findClientById,
  findClientByKeyHash,
  findWechatAccountByAppId,
  listClientsWithBindings,
  updateApiClientKeyHash,
  updateApiClientStatus,
} from '@tentacle-pro/db'
import { encrypt, sha256Hex } from '@tentacle-pro/core'
import { requireAdmin } from '../auth'

function genId(): string {
  return crypto.randomUUID().replaceAll('-', '').slice(0, 21)
}

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return Array.from(arr, (n) => n.toString(16).padStart(2, '0')).join('')
}

function generateApiKey(): string {
  return `tpk_${randomHex(20)}`
}

function maskWechatAppId(appId: string | null): string {
  if (!appId) return ''
  if (appId.length <= 8) return `${appId.slice(0, 2)}***${appId.slice(-2)}`
  return `${appId.slice(0, 4)}******${appId.slice(-4)}`
}

async function generateUniqueApiKey(): Promise<{ apiKey: string; apiKeyHash: string }> {
  for (let i = 0; i < 5; i++) {
    const apiKey = generateApiKey()
    const apiKeyHash = await sha256Hex(apiKey)
    const existing = await findClientByKeyHash(apiKeyHash)
    if (!existing) {
      return { apiKey, apiKeyHash }
    }
  }
  throw new Error('Failed to generate unique API key')
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

const clientIdParamSchema = z.object({
  clientId: z.string().min(3).max(64),
})

const updateStatusSchema = z.object({
  status: z.enum(['active', 'disabled']),
})

export const adminClientsApp = new Hono()

// All routes require admin JWT cookie
adminClientsApp.use('*', requireAdmin)

/** GET /admin/clients 列出客户与绑定关系 */
adminClientsApp.get('/', async (c) => {
  const rows = await listClientsWithBindings()

  return c.json({
    ok: true,
    data: rows.map((row) => ({
      client_id: row.clientId,
      client_name: row.clientName,
      status: row.clientStatus,
      plan: row.clientPlan,
      created_at: row.clientCreatedAt,
      updated_at: row.clientUpdatedAt,
      wechat_account_id: row.wechatAccountId,
      wechat_app_id: row.wechatAppId,
      wechat_app_id_masked: maskWechatAppId(row.wechatAppId),
      account_name: row.wechatAccountName,
      permission_scope: row.permissionScope,
    })),
  })
})

/**
 * POST /admin/clients
 * 创建一个完整的客户记录：api_client + wechat_account + binding
 * 服务端自动生成 API_KEY；wechat_app_secret 由服务端加密后存库
 */
adminClientsApp.post(
  '/',
  zValidator('json', createClientSchema),
  async (c) => {
    const body = c.req.valid('json')

    const existingClient = await findClientById(body.client_id)
    if (existingClient) {
      return c.json(
        { ok: false, error: { message: 'A client with this client_id already exists' } },
        409
      )
    }

    const existingWechat = await findWechatAccountByAppId(body.wechat_app_id)
    if (existingWechat) {
      return c.json(
        { ok: false, error: { message: 'A WeChat account with this app_id already exists' } },
        409
      )
    }

    // 加密微信 APP_SECRET（AES-GCM，密钥来自 ENCRYPTION_KEY 环境变量）
    const appSecretEncrypted = await encrypt(body.wechat_app_secret)
    const { apiKey, apiKeyHash } = await generateUniqueApiKey()

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
          api_key: apiKey,
          wechat_account_id: wechatAccountId,
          binding_id: bindingId,
        },
      },
      201
    )
  }
)

/** PATCH /admin/clients/:clientId/status 手动启用/禁用客户 */
adminClientsApp.patch(
  '/:clientId/status',
  zValidator('param', clientIdParamSchema),
  zValidator('json', updateStatusSchema),
  async (c) => {
    const { clientId } = c.req.valid('param')
    const { status } = c.req.valid('json')

    const client = await findClientById(clientId)
    if (!client) {
      return c.json({ ok: false, error: { message: 'Client not found' } }, 404)
    }

    await updateApiClientStatus({ id: clientId, status })

    return c.json({
      ok: true,
      data: {
        client_id: clientId,
        status,
      },
    })
  }
)

/** POST /admin/clients/:clientId/regenerate-api-key 重新生成 API_KEY */
adminClientsApp.post(
  '/:clientId/regenerate-api-key',
  zValidator('param', clientIdParamSchema),
  async (c) => {
    const { clientId } = c.req.valid('param')
    const client = await findClientById(clientId)

    if (!client) {
      return c.json({ ok: false, error: { message: 'Client not found' } }, 404)
    }

    const { apiKey, apiKeyHash } = await generateUniqueApiKey()
    await updateApiClientKeyHash({ id: clientId, apiKeyHash })

    return c.json({
      ok: true,
      data: {
        client_id: clientId,
        api_key: apiKey,
      },
    })
  }
)
