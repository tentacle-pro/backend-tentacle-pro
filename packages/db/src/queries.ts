import { eq } from 'drizzle-orm'
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
