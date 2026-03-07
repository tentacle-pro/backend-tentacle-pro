/**
 * Hono Context 变量类型声明
 * 由中间件注入，在 handler 中通过 c.get() 访问
 */
export interface AppVariables {
  requestId: string
  // 以下字段在通过 authMiddleware 后才存在
  clientId: string
  clientName: string
  wechatAccountId: string
}
