/**
 * 创建测试用的 API 客户端、占位公众号账号和绑定关系
 * 用法：cd api && bun run scripts/seed-test-client.ts
 *
 * 会打印出可直接用于 curl 测试的 API Key。
 */

import { getDb, apiClients, wechatAccounts, clientAccountBindings, eq } from '@tentacle-pro/db'
import { sha256Hex, encrypt } from '@tentacle-pro/core'

const TEST_API_KEY = 'test-api-key-local-dev-only'
const TEST_WECHAT_APP_SECRET = 'wx-placeholder-secret-local'
const TEST_CLIENT_ID = 'test-client-001'
const TEST_WECHAT_ID = 'test-wechat-account-001'
const TEST_BINDING_ID = 'test-binding-001'

async function main() {
  const db = getDb()
  const keyHash = await sha256Hex(TEST_API_KEY)
  const appSecretEncrypted = await encrypt(TEST_WECHAT_APP_SECRET)

  // 幂等地插入测试客户端
  const existing = await db.query.apiClients.findFirst({
    where: eq(apiClients.id, TEST_CLIENT_ID),
  })

  if (!existing) {
    await db.insert(apiClients).values({
      id: TEST_CLIENT_ID,
      name: '本地测试客户端',
      apiKeyHash: keyHash,
      status: 'active',
    })
    console.log('✅ 创建测试客户端')
  } else {
    // 更新 key hash（以防 key 变更）
    await db.update(apiClients).set({ apiKeyHash: keyHash }).where(eq(apiClients.id, TEST_CLIENT_ID))
    console.log('ℹ️  测试客户端已存在，已更新 key hash')
  }

  // 幂等地插入占位公众号账号
  const existingWx = await db.query.wechatAccounts.findFirst({
    where: eq(wechatAccounts.id, TEST_WECHAT_ID),
  })
  if (!existingWx) {
    await db.insert(wechatAccounts).values({
      id: TEST_WECHAT_ID,
      appId: 'wx_test_placeholder',
      appSecretEncrypted,
      accountName: '测试公众号（占位）',
      status: 'active',
    })
    console.log('✅ 创建占位公众号账号')
  } else {
    // 重新加密并更新（防止密钥轮换或旧记录存的是明文）
    await db.update(wechatAccounts).set({ appSecretEncrypted }).where(eq(wechatAccounts.id, TEST_WECHAT_ID))
    console.log('ℹ️  占位公众号账号已存在，已更新加密 secret')
  }

  // 幂等地插入绑定关系
  const existingBinding = await db.query.clientAccountBindings.findFirst({
    where: eq(clientAccountBindings.id, TEST_BINDING_ID),
  })
  if (!existingBinding) {
    await db.insert(clientAccountBindings).values({
      id: TEST_BINDING_ID,
      clientId: TEST_CLIENT_ID,
      wechatAccountId: TEST_WECHAT_ID,
      permissionScope: 'full',
    })
    console.log('✅ 创建客户端-公众号绑定')
  }

  console.log('\n🔑 测试 API Key：', TEST_API_KEY)
  console.log('\n示例 curl：')
  console.log(`curl -X POST http://localhost:3001/markdown2html \\`)
  console.log(`  -H "Content-Type: application/json" \\`)
  console.log(`  -H "Authorization: Bearer ${TEST_API_KEY}" \\`)
  console.log(`  -d '{"markdown":"# Hello\\n\\nWorld","templateId":"preset-classic"}'`)

  process.exit(0)
}

main().catch((e) => {
  console.error('❌', e)
  process.exit(1)
})
