import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { ApiResponse, Markdown2HtmlResponse } from '@tentacle-pro/core'
import { AppError, ErrorCode } from '@tentacle-pro/core'
import { findTemplateById, buildAssetAliasMap } from '@tentacle-pro/db'
import { convertMarkdownToHTML } from '@tentacle-pro/render'
import type { TemplateConfig } from '@tentacle-pro/render'
import type { AppVariables } from '../types'

const markdown2htmlSchema = z.object({
  markdown: z.string().min(1, 'markdown is required'),
  templateId: z.string().min(1, 'templateId is required'),
  title: z.string().optional(),
})

export const markdown2htmlRouter = new Hono<{ Variables: AppVariables }>()

markdown2htmlRouter.post(
  '/',
  zValidator('json', markdown2htmlSchema),
  async (c) => {
    const { markdown, templateId } = c.req.valid('json')
    const requestId = c.get('requestId')

    const template = await findTemplateById(templateId)
    if (!template) {
      throw new AppError(
        ErrorCode.RENDER_400_INVALID_TEMPLATE,
        `Template "${templateId}" not found`,
        400
      )
    }

    // 从 DB 读取素材别名映射，合并到 templateConfig.assets
    const dbAssets = await buildAssetAliasMap()
    const templateConfig = template.config as TemplateConfig
    const configWithAssets: TemplateConfig = {
      ...templateConfig,
      assets: { ...dbAssets, ...(templateConfig.assets ?? {}) },
    }

    const result = await convertMarkdownToHTML(markdown, configWithAssets)

    const body: ApiResponse<Markdown2HtmlResponse> = {
      ok: true,
      request_id: requestId,
      data: { html: result.html },
    }
    return c.json(body)
  }
)
