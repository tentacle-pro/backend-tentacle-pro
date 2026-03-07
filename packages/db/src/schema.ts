import {
  pgTable,
  text,
  timestamp,
  integer,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'

// ─── api_clients ────────────────────────────────────────────────────────────
// 存储 API 客户端信息，api_key 仅保存 SHA-256 哈希

export const apiClients = pgTable(
  'api_clients',
  {
    id: text('id').primaryKey(), // nanoid / uuid
    name: text('name').notNull(),
    apiKeyHash: text('api_key_hash').notNull(),
    status: text('status').notNull().default('active'), // active | disabled
    // 预留计费字段
    plan: text('plan').default('free'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('api_clients_api_key_hash_idx').on(t.apiKeyHash)]
)

// ─── wechat_accounts ────────────────────────────────────────────────────────
// 存储公众号账号信息，app_secret 加密存储

export const wechatAccounts = pgTable('wechat_accounts', {
  id: text('id').primaryKey(),
  appId: text('app_id').notNull().unique(),
  appSecretEncrypted: text('app_secret_encrypted').notNull(),
  accountName: text('account_name').notNull(),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── client_account_bindings ────────────────────────────────────────────────
// API 客户端与公众号账号的绑定关系

export const clientAccountBindings = pgTable('client_account_bindings', {
  id: text('id').primaryKey(),
  clientId: text('client_id')
    .notNull()
    .references(() => apiClients.id),
  wechatAccountId: text('wechat_account_id')
    .notNull()
    .references(() => wechatAccounts.id),
  permissionScope: text('permission_scope').notNull().default('full'), // full | read
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── wechat_tokens ──────────────────────────────────────────────────────────
// 缓存微信 access_token，每个公众号唯一

export const wechatTokens = pgTable(
  'wechat_tokens',
  {
    id: text('id').primaryKey(),
    wechatAccountId: text('wechat_account_id')
      .notNull()
      .unique()
      .references(() => wechatAccounts.id),
    accessTokenEncrypted: text('access_token_encrypted').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    refreshedAt: timestamp('refreshed_at', { withTimezone: true }).notNull().defaultNow(),
    version: integer('version').notNull().default(0), // 乐观锁
  },
  (t) => [
    index('wechat_tokens_account_expires_idx').on(
      t.wechatAccountId,
      t.expiresAt
    ),
  ]
)

// ─── publish_audit_logs ─────────────────────────────────────────────────────
// 请求审计日志（脱敏）

export const publishAuditLogs = pgTable(
  'publish_audit_logs',
  {
    id: text('id').primaryKey(),
    requestId: text('request_id').notNull(),
    clientId: text('client_id'), // nullable: 未认证请求也记录
    endpoint: text('endpoint').notNull(),
    method: text('method').notNull(),
    payloadDigest: text('payload_digest'), // SHA-256 of request body
    resultStatus: integer('result_status').notNull(),
    errorCode: text('error_code'),
    latencyMs: integer('latency_ms'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('publish_audit_logs_client_created_idx').on(
      t.clientId,
      t.createdAt
    ),
  ]
)
