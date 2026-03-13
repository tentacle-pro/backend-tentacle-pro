import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { ApiResponse, Markdown2HtmlResponse } from '@tentacle-pro/core'
import { AppError, ErrorCode } from '@tentacle-pro/core'
import { findTemplateById, buildAssetAliasMap, findClientInjections } from '@tentacle-pro/db'
import { convertMarkdownToHTML } from '@tentacle-pro/render'
import type { TemplateConfig } from '@tentacle-pro/render'
import type { AppVariables } from '../types'

const markdown2htmlSchema = z.object({
  markdown: z.string().min(1, 'markdown is required'),
  templateId: z.string().min(1, 'templateId is required'),
  title: z.string().optional(),
})

/**
 * 将客户端注入的 HTML 片段按位置合并到最终的 HTML 中。
 * position 枚举：
 *   header        — 正文最前
 *   after_abstract — 首段后（第一个 </p> 后）
 *   footer        — 正文最后
 */
function applyHtmlInjections(
  html: string,
  injections: Array<{ position: string; html: string }>
): string {
  const collect = (pos: string) =>
    injections.filter((i) => i.position === pos).map((i) => i.html)

  const headerParts = collect('header')
  const afterAbstractParts = collect('after_abstract')
  const footerParts = collect('footer')

  let result = html

  if (headerParts.length > 0) {
    result = headerParts.join('\n') + '\n' + result
  }

  if (afterAbstractParts.length > 0) {
    // 微信/标注工具首段之后通常跟在 </p> 闭合标签之后
    const sep = result.indexOf('</p>')
    const inject = '\n' + afterAbstractParts.join('\n')
    if (sep !== -1) {
      result = result.slice(0, sep + 4) + inject + result.slice(sep + 4)
    } else {
      // 没找到段落标签，直接追加
      result = result + inject
    }
  }

  if (footerParts.length > 0) {
    result = result + '\n' + footerParts.join('\n')
  }

  return result
}

export const markdown2htmlRouter = new Hono<{ Variables: AppVariables }>()

markdown2htmlRouter.post(
  '/',
  zValidator('json', markdown2htmlSchema),
  async (c) => {
    const { markdown, templateId } = c.req.valid('json')
    const requestId = c.get('requestId')
    const clientId = c.get('clientId')

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

    // 转换为 HTML
    const result = await convertMarkdownToHTML(markdown, configWithAssets)

    // 加载客户端自定义 HTML 片段并注入
    const injections = await findClientInjections(clientId)
    const finalHtml = injections.length > 0
      ? applyHtmlInjections(result.html, injections)
      : result.html

    const body: ApiResponse<Markdown2HtmlResponse> = {
      ok: true,
      request_id: requestId,
      data: { html: finalHtml },
    }
    return c.json(body)
  }
)
