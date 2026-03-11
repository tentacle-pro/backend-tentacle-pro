// 核心 Markdown → 微信兼容 HTML 转换管道

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { rehypeInjectStyles } from './rehype-inject-styles'
import { rehypeWechatEnhancements } from './rehype-wechat-enhancements'
import type { Plugin } from 'unified'
import type { TemplateConfig, ConversionResult } from './types'

interface TreeData {
  warnings?: string[]
}

// ─── Frontmatter 解析 ────────────────────────────────────────────────────────

function parseSimpleYaml(text: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const line of text.split('\n')) {
    const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s+(.+)/)
    if (!m) continue
    const key = m[1]!
    let value = (m[2] || '').trim()
    // 跳过数组值
    if (value.startsWith('[')) continue
    // 去除首尾引号
    if (/^["'].*["']$/.test(value)) value = value.slice(1, -1)
    result[key] = value
  }
  return result
}

/** Remark 插件：提取 YAML frontmatter → file.data.matter，并从 AST 中移除 */
const remarkExtractFrontmatter: Plugin = function () {
  return (tree: any, file: any) => {
    const first = tree.children?.[0]
    if (first?.type === 'yaml') {
      file.data.matter = parseSimpleYaml(String(first.value))
      tree.children.splice(0, 1)
    }
  }
}

/** 将十六进制颜色转换为 rgba，用于生成响应主题色的半透明背景 */
function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace('#', '').match(/.{2}/g)
  if (!m || m.length < 3) return `rgba(0,0,0,${alpha})`
  return `rgba(${parseInt(m[0]!, 16)}, ${parseInt(m[1]!, 16)}, ${parseInt(m[2]!, 16)}, ${alpha})`
}

/** Rehype 插件工厂：将 frontmatter 元信息（日期、作者、原文链接）渲染为文章顶部信息栏 */
function rehypeFrontmatterMeta(templateConfig: TemplateConfig): Plugin {
  const brandColor =
    templateConfig.variables?.brandColor ||
    templateConfig.global?.themeColor ||
    '#888888'

  return function () {
    return (tree: any, file: any) => {
      const matter = file.data?.matter as Record<string, string> | undefined
      if (!matter) return

      // 组装 meta 行子节点（日期 · 作者 · 原文链接）
      const metaParts: any[] = []
      const dot = {
        type: 'element', tagName: 'span',
        properties: { style: 'margin: 0 6px; color: #ccc' },
        children: [{ type: 'text', value: '·' }],
      }
      if (matter.date) metaParts.push({ type: 'text', value: matter.date })
      if (matter.author) {
        if (metaParts.length) metaParts.push(dot)
        metaParts.push({ type: 'text', value: matter.author })
      }
      if (matter.original_url) {
        if (metaParts.length) metaParts.push(dot)
        metaParts.push({
          type: 'element', tagName: 'a',
          properties: { href: matter.original_url, style: `color: ${brandColor}; text-decoration: underline` },
          children: [{ type: 'text', value: '原文链接' }],
        })
      }

      const hasMeta = metaParts.length > 0
      const hasSummary = !!matter.summary
      if (!hasMeta && !hasSummary) return

      // 查找 h1 之后的插入位置
      let insertIdx = 0
      for (let i = 0; i < tree.children.length; i++) {
        const node = tree.children[i]
        if (node?.type === 'element' && node.tagName === 'h1') {
          insertIdx = i + 1
          break
        }
      }

      const nodesToInsert: any[] = []

      if (hasSummary) {
        // 有摘要：渲染完整边框的摘要卡片，meta 信息作为卡片顶部小字（如有）
        const cardChildren: any[] = []

        if (hasMeta) {
          cardChildren.push({
            type: 'element', tagName: 'p',
            properties: {
              style: [
                'margin: 0 0 10px',
                'padding-bottom: 10px',
                `border-bottom: 1px solid ${hexToRgba(brandColor, 0.2)}`,
                'font-size: 12px',
                'color: #999',
                'font-family: system-ui, -apple-system, PingFang SC, Microsoft YaHei, sans-serif',
              ].join('; '),
            },
            children: metaParts,
          })
        }

        cardChildren.push({
          type: 'element', tagName: 'p',
          properties: {
            style: [
              'margin: 0',
              'font-size: 14px',
              'color: #555',
              'line-height: 1.9',
              'font-family: system-ui, -apple-system, PingFang SC, Microsoft YaHei, sans-serif',
            ].join('; '),
          },
          children: [{ type: 'text', value: matter.summary }],
        })

        nodesToInsert.push({
          type: 'element', tagName: 'section',
          properties: {
            style: [
              'margin: 8px 0 28px',
              'padding: 16px 18px',
              `border: 1px solid ${hexToRgba(brandColor, 0.35)}`,
              `border-left: 4px solid ${brandColor}`,
              'border-radius: 6px',
              `background-color: ${hexToRgba(brandColor, 0.04)}`,
            ].join('; '),
          },
          children: cardChildren,
        })
      } else {
        // 无摘要：退回细线 meta 行
        nodesToInsert.push({
          type: 'element', tagName: 'p',
          properties: {
            style: 'font-size: 13px; color: #999; text-align: center; margin-top: 4px; margin-bottom: 24px; padding-top: 8px; padding-bottom: 8px; line-height: 1.8; border-top: 1px solid #eee; border-bottom: 1px solid #eee; font-family: system-ui, -apple-system, PingFang SC, Microsoft YaHei, sans-serif',
          },
          children: metaParts,
        })
      }

      tree.children.splice(insertIdx, 0, ...nodesToInsert)
    }
  }
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
    .use(remarkFrontmatter)
    .use(remarkExtractFrontmatter)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeWechatEnhancements)
    .use(rehypeFrontmatterMeta(templateConfig))
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
