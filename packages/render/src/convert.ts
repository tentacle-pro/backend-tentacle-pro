// 核心 Markdown → 微信兼容 HTML 转换管道

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { rehypeInjectStyles } from './rehype-inject-styles'
import { rehypeWechatEnhancements } from './rehype-wechat-enhancements'
import type { TemplateConfig, ConversionResult } from './types'

interface TreeData {
  warnings?: string[]
}

/**
 * 将 Markdown 转换为带内联样式的微信兼容 HTML
 */
export async function convertMarkdownToHTML(
  markdown: string,
  templateConfig: TemplateConfig
): Promise<ConversionResult> {
  const markerProcessed = preprocessAssetAliasMarkers(
    markdown,
    templateConfig.assets || {}
  )

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeWechatEnhancements)
    .use(rehypeInjectStyles, templateConfig)
    .use(rehypeStringify)

  const result = await processor.process(markerProcessed.markdown)

  const warnings = [
    ...markerProcessed.warnings,
    ...(((result.data as TreeData)?.warnings) || []),
  ]

  return { html: String(result), warnings }
}

/**
 * 批量转换
 */
export async function convertMultipleMarkdowns(
  markdowns: string[],
  templateConfig: TemplateConfig
): Promise<ConversionResult[]> {
  return Promise.all(markdowns.map((md) => convertMarkdownToHTML(md, templateConfig)))
}

// ─── 内部：预处理 {{asset:alias}} 语法 ────────────────────────────────────

function preprocessAssetAliasMarkers(
  markdown: string,
  assets: Record<string, string>
): { markdown: string; warnings: string[] } {
  const warnings: string[] = []
  const aliasRegex = /\{\{asset:([a-zA-Z0-9_-]+)\}\}/g

  const transformed = markdown.replace(aliasRegex, (full, aliasRaw: string) => {
    const alias = String(aliasRaw || '').trim()
    const url = assets[alias]
    if (!url) {
      warnings.push(`素材别名未配置：{{asset:${alias}}}`)
      return full
    }
    return `![${alias}](${url})`
  })

  return { markdown: transformed, warnings }
}
