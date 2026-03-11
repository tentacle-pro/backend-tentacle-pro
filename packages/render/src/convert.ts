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

      const parts: any[] = []
      const dot = {
        type: 'element', tagName: 'span',
        properties: { style: 'margin: 0 8px; color: #ccc' },
        children: [{ type: 'text', value: '·' }],
      }

      if (matter.date) {
        parts.push({ type: 'text', value: matter.date })
      }
      if (matter.author) {
        if (parts.length) parts.push(dot)
        parts.push({ type: 'text', value: matter.author })
      }
      if (matter.original_url) {
        if (parts.length) parts.push(dot)
        parts.push({
          type: 'element', tagName: 'a',
          properties: {
            href: matter.original_url,
            style: `color: ${brandColor}; text-decoration: underline`,
          },
          children: [{ type: 'text', value: '原文链接' }],
        })
      }

      if (!parts.length) return

      const metaNode = {
        type: 'element',
        tagName: 'p',
        properties: {
          style: 'font-size: 13px; color: #888; text-align: center; margin: -8px 0 20px; line-height: 2; font-family: system-ui, -apple-system, PingFang SC, Microsoft YaHei, sans-serif',
        },
        children: parts,
      }

      // 插入到第一个 <h1> 之后，若无 h1 则插入到开头
      let insertIdx = 0
      for (let i = 0; i < tree.children.length; i++) {
        const node = tree.children[i]
        if (node?.type === 'element' && node.tagName === 'h1') {
          insertIdx = i + 1
          break
        }
      }
      tree.children.splice(insertIdx, 0, metaNode)
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
