import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { findTemplateById, buildAssetAliasMap } from '@tentacle-pro/db'
import { convertMarkdownToHTML } from '@tentacle-pro/render'
import { requireAdmin } from '../auth'

export const adminConvertApp = new Hono()

adminConvertApp.use('*', requireAdmin)

adminConvertApp.post(
  '/',
  zValidator(
    'json',
    z.object({
      templateId: z.string(),
      markdown: z.string(),
      templateConfig: z
        .object({
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
        .optional(),
    }),
  ),
  async (c) => {
    const { templateId, markdown, templateConfig } = c.req.valid('json')

    const template = await findTemplateById(templateId)
    if (!template) {
      return c.json({ ok: false, error: { message: 'Template not found' } }, 404)
    }

    const dbAliasMap = await buildAssetAliasMap()

    // Merge: template.config.assets + request assets (request overrides)
    const baseConfig = template.config as {
      global?: Record<string, string>
      variables?: Record<string, string>
      styles?: Record<string, string>
      assets?: Record<string, string>
      meta?: {
        presetKey?: string
        presetName?: string
        description?: string
        locked?: boolean
      }
    }

    const mergedConfig = templateConfig
      ? {
          global: { ...(baseConfig.global ?? {}), ...(templateConfig.global ?? {}) },
          variables: { ...(baseConfig.variables ?? {}), ...(templateConfig.variables ?? {}) },
          styles: { ...(baseConfig.styles ?? {}), ...(templateConfig.styles ?? {}) },
          assets: { ...dbAliasMap, ...(baseConfig.assets ?? {}), ...(templateConfig.assets ?? {}) },
          meta: { ...(baseConfig.meta ?? {}), ...(templateConfig.meta ?? {}) },
        }
      : {
          global: baseConfig.global ?? {},
          variables: baseConfig.variables ?? {},
          styles: baseConfig.styles ?? {},
          assets: { ...dbAliasMap, ...(baseConfig.assets ?? {}) },
          meta: baseConfig.meta ?? {},
        }

    const result = await convertMarkdownToHTML(markdown, mergedConfig)

    return c.json({ ok: true, data: { html: result.html, warnings: result.warnings ?? [] } })
  },
)
