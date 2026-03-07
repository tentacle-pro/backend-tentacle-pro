import { eq } from 'drizzle-orm'
import { getDb } from './client'
import { apiClients, clientAccountBindings, wechatAccounts } from './schema'

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
