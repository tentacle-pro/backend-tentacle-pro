import { Hono } from 'hono'
import { listTemplates, findTemplateById } from '@tentacle-pro/db'
import type { ApiResponse } from '@tentacle-pro/core'
import { AppError, ErrorCode } from '@tentacle-pro/core'
import type { TemplateConfig } from '@tentacle-pro/render'
import type { AppVariables } from '../types'

export const templatesRouter = new Hono<{ Variables: AppVariables }>()

function mapTemplateView(template: {
  id: string
  name: string
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
  config: unknown
}) {
  const config = template.config as TemplateConfig
  const meta = config?.meta ?? {}
  const isBuiltinPreset = Boolean(meta.presetKey && meta.locked)
  return {
    id: template.id,
    name: template.name,
    isDefault: template.isDefault,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    config,
    presetKey: meta.presetKey ?? null,
    isBuiltinPreset,
    canEditConfig: !isBuiltinPreset,
  }
}

/** GET /templates — 列出所有模板（id, name, isDefault，不含完整 config） */
templatesRouter.get('/', async (c) => {
  const requestId = c.get('requestId')
  const rows = await listTemplates()
  const data = rows.map(mapTemplateView)
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
  const body: ApiResponse<ReturnType<typeof mapTemplateView>> = {
    ok: true,
    request_id: requestId,
    data: mapTemplateView(template),
  }
  return c.json(body)
})
