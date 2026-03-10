import { desc, eq } from 'drizzle-orm'
import { getDb } from './client'
import { apiClients, clientAccountBindings, wechatAccounts, templates, renderAssets } from './schema'

export { eq } from 'drizzle-orm'

/** 通过 api_key_hash 查找客户端 */
export async function findClientByKeyHash(keyHash: string) {
  const db = getDb()
  return db.query.apiClients.findFirst({
    where: eq(apiClients.apiKeyHash, keyHash),
  })
}

/** 通过 client_id 查找客户端 */
export async function findClientById(clientId: string) {
  const db = getDb()
  return db.query.apiClients.findFirst({
    where: eq(apiClients.id, clientId),
  })
}

/** 列出所有客户端及其绑定公众号信息 */
export async function listClientsWithBindings() {
  const db = getDb()
  return db
    .select({
      clientId: apiClients.id,
      clientName: apiClients.name,
      clientStatus: apiClients.status,
      clientPlan: apiClients.plan,
      clientCreatedAt: apiClients.createdAt,
      clientUpdatedAt: apiClients.updatedAt,
      wechatAccountId: wechatAccounts.id,
      wechatAppId: wechatAccounts.appId,
      wechatAccountName: wechatAccounts.accountName,
      wechatStatus: wechatAccounts.status,
      bindingId: clientAccountBindings.id,
      permissionScope: clientAccountBindings.permissionScope,
      bindingCreatedAt: clientAccountBindings.createdAt,
    })
    .from(apiClients)
    .leftJoin(clientAccountBindings, eq(clientAccountBindings.clientId, apiClients.id))
    .leftJoin(wechatAccounts, eq(wechatAccounts.id, clientAccountBindings.wechatAccountId))
    .orderBy(desc(apiClients.createdAt))
}

/** 通过 client_id 查找绑定的公众号账号 */
export async function findBindingByClientId(clientId: string) {
  const db = getDb()
  return db.query.clientAccountBindings.findFirst({
    where: eq(clientAccountBindings.clientId, clientId),
  })
}

/** 通过 wechat_account_id 查找公众号账号 */
export async function findWechatAccountById(id: string) {
  const db = getDb()
  return db.query.wechatAccounts.findFirst({
    where: eq(wechatAccounts.id, id),
  })
}

/** 通过 app_id 查找公众号账号 */
export async function findWechatAccountByAppId(appId: string) {
  const db = getDb()
  return db.query.wechatAccounts.findFirst({
    where: eq(wechatAccounts.appId, appId),
  })
}

// ─── Templates ───────────────────────────────────────────────────────────────

/** 列出所有模板，默认模板排最前 */
export async function listTemplates() {
  const db = getDb()
  return db.query.templates.findMany({
    orderBy: (t, { desc }) => [desc(t.isDefault), desc(t.createdAt)],
  })
}

/** 通过 ID 查找模板 */
export async function findTemplateById(id: string) {
  const db = getDb()
  return db.query.templates.findFirst({
    where: eq(templates.id, id),
  })
}

/** 查找默认模板 */
export async function findDefaultTemplate() {
  const db = getDb()
  return db.query.templates.findFirst({
    where: eq(templates.isDefault, true),
  })
}

// ─── Render Assets ───────────────────────────────────────────────────────────

/** 通过别名查找素材 */
export async function findAssetByAlias(alias: string) {
  const db = getDb()
  return db.query.renderAssets.findFirst({
    where: eq(renderAssets.alias, alias),
  })
}

/** 通过文件名查找素材 */
export async function findAssetByFilename(filename: string) {
  const db = getDb()
  return db.query.renderAssets.findFirst({
    where: eq(renderAssets.filename, filename),
  })
}

/** 列出所有素材 */
export async function listAssets() {
  const db = getDb()
  return db.query.renderAssets.findMany({
    orderBy: (t, { desc }) => [desc(t.uploadedAt)],
  })
}

/** 构建 alias→url 映射，供 render 引擎使用 */
export async function buildAssetAliasMap(): Promise<Record<string, string>> {
  const assets = await listAssets()
  const map: Record<string, string> = {}
  for (const asset of assets) {
    map[asset.alias] = asset.url
  }
  return map
}

// ─── Admin write helpers ──────────────────────────────────────────────────────

/** 新增 API 客户端（api_key_hash 由调用方提前计算好后传入） */
export async function createApiClient(input: {
  id: string
  name: string
  apiKeyHash: string
  plan?: string
  status?: string
}) {
  const db = getDb()
  await db.insert(apiClients).values({
    id: input.id,
    name: input.name,
    apiKeyHash: input.apiKeyHash,
    plan: input.plan ?? 'free',
    status: input.status ?? 'active',
  })
}

/** 新增微信公众号账号（appSecretEncrypted 由调用方提前加密后传入） */
export async function createWechatAccount(input: {
  id: string
  appId: string
  appSecretEncrypted: string
  accountName: string
  status?: string
}) {
  const db = getDb()
  await db.insert(wechatAccounts).values({
    id: input.id,
    appId: input.appId,
    appSecretEncrypted: input.appSecretEncrypted,
    accountName: input.accountName,
    status: input.status ?? 'active',
  })
}

/** 新增客户端-公众号绑定 */
export async function createClientAccountBinding(input: {
  id: string
  clientId: string
  wechatAccountId: string
  permissionScope?: string
}) {
  const db = getDb()
  await db.insert(clientAccountBindings).values({
    id: input.id,
    clientId: input.clientId,
    wechatAccountId: input.wechatAccountId,
    permissionScope: input.permissionScope ?? 'full',
  })
}

/** 更新客户端状态 */
export async function updateApiClientStatus(input: { id: string; status: string }) {
  const db = getDb()
  await db
    .update(apiClients)
    .set({
      status: input.status,
      updatedAt: new Date(),
    })
    .where(eq(apiClients.id, input.id))
}

/** 更新客户端 API Key hash */
export async function updateApiClientKeyHash(input: { id: string; apiKeyHash: string }) {
  const db = getDb()
  await db
    .update(apiClients)
    .set({
      apiKeyHash: input.apiKeyHash,
      updatedAt: new Date(),
    })
    .where(eq(apiClients.id, input.id))
}
