import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { getDb, templates, listTemplates, findTemplateById } from '@tentacle-pro/db'
import { eq } from '@tentacle-pro/db'
import { requireAdmin } from '../auth'

const TemplateConfigSchema = z.object({
  global: z.record(z.string()).optional(),
  variables: z.record(z.string()).optional(),
  styles: z.record(z.string()).optional(),
  assets: z.record(z.string()).optional(),
})

export const adminTemplatesApp = new Hono()

// All routes require admin auth
adminTemplatesApp.use('*', requireAdmin)

adminTemplatesApp.get('/', async (c) => {
  const rows = await listTemplates()
  const data = rows.map((t) => ({
    id: t.id,
    name: t.name,
    isDefault: t.isDefault,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }))
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
    data: {
      id: row.id,
      name: row.name,
      config: row.config,
      isDefault: row.isDefault,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
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
        config: body.config,
        isDefault: false,
      })
      .returning()

    return c.json({ ok: true, data: row }, 201)
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

    if (existing.isDefault && body.config !== undefined) {
      return c.json({ ok: false, error: { message: 'Cannot modify default template config' } }, 400)
    }

    const db = getDb()
    const [updated] = await db
      .update(templates)
      .set({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.config !== undefined ? { config: body.config } : {}),
        updatedAt: new Date(),
      })
      .where(eq(templates.id, id))
      .returning()

    return c.json({ ok: true, data: updated })
  },
)

adminTemplatesApp.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const existing = await findTemplateById(id)
  if (!existing) {
    return c.json({ ok: false, error: { message: 'Template not found' } }, 404)
  }
  if (existing.isDefault) {
    return c.json({ ok: false, error: { message: 'Cannot delete default template' } }, 400)
  }

  const db = getDb()
  await db.delete(templates).where(eq(templates.id, id))
  return c.json({ ok: true, data: { id } })
})
