import { eq } from 'drizzle-orm'
import { getDb } from './client'
import { wechatTokens, wechatAccounts } from './schema'

export interface UpsertTokenInput {
  wechatAccountId: string
  accessTokenEncrypted: string
  expiresAt: Date
}

/** 查询某公众号的 token 记录 */
export async function findTokenByAccountId(wechatAccountId: string) {
  const db = getDb()
  return db.query.wechatTokens.findFirst({
    where: eq(wechatTokens.wechatAccountId, wechatAccountId),
  })
}

/** Upsert token（有则更新，无则插入） */
export async function upsertToken(input: UpsertTokenInput): Promise<void> {
  const db = getDb()

  const existing = await findTokenByAccountId(input.wechatAccountId)

  if (existing) {
    await db
      .update(wechatTokens)
      .set({
        accessTokenEncrypted: input.accessTokenEncrypted,
        expiresAt: input.expiresAt,
        refreshedAt: new Date(),
        version: existing.version + 1,
      })
      .where(eq(wechatTokens.wechatAccountId, input.wechatAccountId))
  } else {
    await db.insert(wechatTokens).values({
      id: crypto.randomUUID(),
      wechatAccountId: input.wechatAccountId,
      accessTokenEncrypted: input.accessTokenEncrypted,
      expiresAt: input.expiresAt,
      refreshedAt: new Date(),
      version: 0,
    })
  }
}

/** 查询公众号账号信息（含加密的 app_secret） */
export async function findWechatAccount(id: string) {
  const db = getDb()
  return db.query.wechatAccounts.findFirst({
    where: eq(wechatAccounts.id, id),
  })
}
