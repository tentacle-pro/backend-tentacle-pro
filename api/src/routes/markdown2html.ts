import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { ApiResponse, Markdown2HtmlResponse } from '@tentacle-pro/core'
import { AppError, ErrorCode } from '@tentacle-pro/core'
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

    // TODO: 后续接入真实渲染引擎（marked / markdown-it + 模板系统）
    if (!isSupportedTemplate(templateId)) {
      throw new AppError(
        ErrorCode.RENDER_400_INVALID_TEMPLATE,
        `Template "${templateId}" is not supported`,
        400
      )
    }

    const html = renderStub(markdown, templateId)

    const body: ApiResponse<Markdown2HtmlResponse> = {
      ok: true,
      request_id: requestId,
      data: { html },
    }
    return c.json(body)
  }
)

// ─── Stub 实现 ─────────────────────────────────────────────────

const SUPPORTED_TEMPLATES = ['default']

function isSupportedTemplate(templateId: string): boolean {
  return SUPPORTED_TEMPLATES.includes(templateId)
}

/**
 * Stub 渲染器：将 Markdown 按简单规则转为 HTML
 * TODO: 替换为真实 marked + 模板渲染逻辑
 */
function renderStub(markdown: string, _templateId: string): string {
  // 极简转换（仅供 stub / MVP 验收使用）
  const lines = markdown.split('\n')
  const html = lines
    .map((line) => {
      if (line.startsWith('# ')) return `<h1>${esc(line.slice(2))}</h1>`
      if (line.startsWith('## ')) return `<h2>${esc(line.slice(3))}</h2>`
      if (line.startsWith('### ')) return `<h3>${esc(line.slice(4))}</h3>`
      if (line.trim() === '') return ''
      return `<p>${esc(line)}</p>`
    })
    .filter(Boolean)
    .join('\n')
  return html
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
