import { Hono } from 'hono'
import { listTemplates, findTemplateById } from '@tentacle-pro/db'
import type { ApiResponse } from '@tentacle-pro/core'
import { AppError, ErrorCode } from '@tentacle-pro/core'
import type { AppVariables } from '../types'

export const templatesRouter = new Hono<{ Variables: AppVariables }>()

/** GET /templates — 列出所有模板（id, name, isDefault，不含完整 config） */
templatesRouter.get('/', async (c) => {
  const requestId = c.get('requestId')
  const rows = await listTemplates()
  const data = rows.map(({ id, name, isDefault, createdAt, updatedAt }) => ({
    id,
    name,
    isDefault,
    createdAt,
    updatedAt,
  }))
  const body: ApiResponse<typeof data> = { ok: true, request_id: requestId, data }
  return c.json(body)
})

/** GET /templates/:id — 获取模板详情（含完整 config） */
templatesRouter.get('/:id', async (c) => {
  const requestId = c.get('requestId')
  const id = c.req.param('id')
  const template = await findTemplateById(id)
  if (!template) {
    throw new AppError(
      ErrorCode.RENDER_400_INVALID_TEMPLATE,
      `Template "${id}" not found`,
      404
    )
  }
  const body: ApiResponse<typeof template> = { ok: true, request_id: requestId, data: template }
  return c.json(body)
})
