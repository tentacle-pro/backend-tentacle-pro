import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { getDb, templates, listTemplates, findTemplateById } from '@tentacle-pro/db'
import { eq } from '@tentacle-pro/db'
import type { TemplateConfig } from '@tentacle-pro/render'
import { requireAdmin } from '../auth'

const TemplateConfigSchema = z.object({
  global: z.record(z.string()).optional(),
  variables: z.record(z.string()).optional(),
  styles: z.record(z.string()).optional(),
  assets: z.record(z.string()).optional(),
  meta: z
    .object({
      presetKey: z.string().optional(),
      presetName: z.string().optional(),
      description: z.string().optional(),
      locked: z.boolean().optional(),
    })
    .optional(),
})

export const adminTemplatesApp = new Hono()

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

// All routes require admin auth
adminTemplatesApp.use('*', requireAdmin)

adminTemplatesApp.get('/', async (c) => {
  const rows = await listTemplates()
  const data = rows.map(mapTemplateView)
  return c.json({ ok: true, data })
})

adminTemplatesApp.get('/:id', async (c) => {
  const id = c.req.param('id')
  const row = await findTemplateById(id)
  if (!row) {
    return c.json({ ok: false, error: { message: 'Template not found' } }, 404)
  }
  return c.json({
    ok: true,
    data: mapTemplateView(row),
  })
})

adminTemplatesApp.post(
  '/',
  zValidator(
    'json',
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      config: TemplateConfigSchema,
    }),
  ),
  async (c) => {
    const body = c.req.valid('json')
    const db = getDb()

    // Check duplicate
    const existing = await findTemplateById(body.id)
    if (existing) {
      return c.json({ ok: false, error: { message: 'Template ID already exists' } }, 400)
    }

    const [row] = await db
      .insert(templates)
      .values({
        id: body.id,
        name: body.name,
        config: {
          ...body.config,
          meta: {
            ...(body.config.meta ?? {}),
            locked: false,
          },
        },
        isDefault: false,
      })
      .returning()

    return c.json({ ok: true, data: mapTemplateView(row) }, 201)
  },
)

adminTemplatesApp.put(
  '/:id',
  zValidator(
    'json',
    z.object({
      name: z.string().min(1).optional(),
      config: TemplateConfigSchema.optional(),
    }),
  ),
  async (c) => {
    const id = c.req.param('id')
    const body = c.req.valid('json')

    const existing = await findTemplateById(id)
    if (!existing) {
      return c.json({ ok: false, error: { message: 'Template not found' } }, 404)
    }

    const existingView = mapTemplateView(existing)
    if (existingView.isBuiltinPreset) {
      return c.json({ ok: false, error: { message: '预置模板不可直接修改，请先另存为模板' } }, 400)
    }

    const db = getDb()
    const [updated] = await db
      .update(templates)
      .set({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.config !== undefined
          ? {
              config: {
                ...body.config,
                meta: {
                  ...(body.config.meta ?? {}),
                  locked: false,
                },
              },
            }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(templates.id, id))
      .returning()

    return c.json({ ok: true, data: mapTemplateView(updated) })
  },
)

adminTemplatesApp.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const existing = await findTemplateById(id)
  if (!existing) {
    return c.json({ ok: false, error: { message: 'Template not found' } }, 404)
  }
  const existingView = mapTemplateView(existing)
  if (existingView.isBuiltinPreset) {
    return c.json({ ok: false, error: { message: '预置模板不可删除' } }, 400)
  }

  const db = getDb()
  await db.delete(templates).where(eq(templates.id, id))
  return c.json({ ok: true, data: { id } })
})
