// 核心 Markdown → 微信兼容 HTML 转换管道

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { rehypeInjectStyles } from './rehype-inject-styles.js'
import { rehypeWechatEnhancements } from './rehype-wechat-enhancements.js'
import { rehypeWechatListBr } from './rehype-wechat-list-br.js'
import { rehypeWechatRenameLists } from './rehype-wechat-rename-lists.js'
import { rehypeWechatNumberedH2 } from './rehype-wechat-numbered-h2.js'
import type { Plugin } from 'unified'
import type { TemplateConfig, ConversionResult } from './types.js'

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
  // global.themeColor 是权威主题色（与 rehype-inject-styles 保持一致：themeColor 总是覆盖 brandColor）
  const brandColor =
    templateConfig.global?.themeColor ||
    templateConfig.variables?.brandColor ||
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
        // 摘要卡片：
        // ┌─ 标题行：[▎ 本文摘要 ▎]  左右各一条主题色竖线镜像装饰
        // ├─ 分割线
        // └─ 摘要正文
        const labelBar = {
          type: 'element', tagName: 'p',
          properties: {
            style: [
              'margin: 0 0 12px',
              'padding-bottom: 12px',
              `border-bottom: 1px solid ${hexToRgba(brandColor, 0.2)}`,
              'display: flex',
              'align-items: center',
              'gap: 8px',
              'font-size: 13px',
              'font-weight: bold',
              `color: ${brandColor}`,
              'letter-spacing: 0.08em',
              'font-family: system-ui, -apple-system, PingFang SC, Microsoft YaHei, sans-serif',
            ].join('; '),
          },
          children: [
            // 左竖线装饰
            {
              type: 'element', tagName: 'span',
              properties: {
                style: `display: inline-block; width: 3px; height: 14px; background: ${brandColor}; border-radius: 2px; vertical-align: middle; margin-right: 6px`,
              },
              children: [],
            },
            { type: 'text', value: '本文摘要' },
            // 右侧镜像竖线（通过 flex 推到右边）
            {
              type: 'element', tagName: 'span',
              properties: { style: 'flex: 1' },
              children: [],
            },
            {
              type: 'element', tagName: 'span',
              properties: {
                style: `display: inline-block; width: 3px; height: 14px; background: ${brandColor}; border-radius: 2px; vertical-align: middle; margin-left: 6px; opacity: 0.35`,
              },
              children: [],
            },
          ],
        }

        const summaryText = {
          type: 'element', tagName: 'p',
          properties: {
            style: [
              'margin: 0',
              'font-size: 14px',
              'color: #555',
              'line-height: 2',
              'font-family: system-ui, -apple-system, PingFang SC, Microsoft YaHei, sans-serif',
            ].join('; '),
          },
          children: [{ type: 'text', value: matter.summary }],
        }

        nodesToInsert.push({
          type: 'element', tagName: 'section',
          properties: {
            style: [
              'margin: 8px 0 28px',
              'padding: 16px 18px',
              `border-top: 2px solid ${brandColor}`,
              `border-bottom: 2px solid ${brandColor}`,
              `border-left: 1px solid ${hexToRgba(brandColor, 0.25)}`,
              `border-right: 1px solid ${hexToRgba(brandColor, 0.25)}`,
              'border-radius: 4px',
              `background-color: ${hexToRgba(brandColor, 0.03)}`,
            ].join('; '),
          },
          children: [labelBar, summaryText],
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
 * 修复 CJK 字符紧靠加粗分隔符时 CommonMark 左临界规则失效的问题。
 *
 * CommonMark rule 6/7：`**` 作为左分界符，若后接 Unicode 标点（Pi/Ps，如 " " 「 （），
 * 则要求前面是空白或标点。但 CJK 汉字属于字母类（L 类），不满足此条件，导致 remark-parse
 * 拒绝将 `**` 识别为加粗起始符。
 *
 * 修复：在 CJK 字符 + `**` + Unicode Pi/Ps 标点 的边界处，插入 U+202F（窄不换行空格，
 * Unicode Zs 类），使 `**` "前有 Unicode 空白"，rule 2b 成立，加粗恢复正常。
 * U+202F 在 HTML 输出中表现为极细间距，对排版影响可忽略不计。
 */
function fixCjkBoldDelimiters(md: string): string {
  // 需要修复的场景：CJK字符 + ** + 全角开引号/括号/书名号等 Unicode Pi/Ps 标点
  // \u2E80-\u9FFF: CJK 统一表意文字（含扩展A/B）及各类 CJK 符号
  // \uF900-\uFAFF: CJK 兼容表意文字
  // \u3040-\u30FF: 平假名 / 片假名
  // 常见中文语境下的 Pi/Ps 标点：" " ' ' （ 《 〈 【 「 『 〔 〖 等
  const CJK = '[\\u2E80-\\u9FFF\\uF900-\\uFAFF\\u3040-\\u30FF]'
  const OPEN_PUNCT = '[\\u201C\\u201D\\u2018\\u2019\\uFF08\\u300A\\u3008\\u3010\\u300C\\u300E\\u3014\\u3016\\u3018\\u301A]'
  // 开始分隔符：CJK汉字 + ** + 开引号/括号 → 插入 U+202F 使 ** 前有"空白"
  md = md.replace(new RegExp(`(${CJK})\\*\\*(?=${OPEN_PUNCT})`, 'g'), '$1\u202F**')
  // 关闭分隔符：闭引号/括号 + ** + CJK汉字 → 插入 U+202F 使 ** 后有"空白"
  // （保险起见同步修复，当前报告的 bug 均为开始分隔符问题）
  const CLOSE_PUNCT = '[\\u201D\\u2019\\uFF09\\u300B\\u3009\\u3011\\u300D\\u300F\\u3015\\u3017\\u3019\\u301B]'
  md = md.replace(new RegExp(`(${CLOSE_PUNCT})\\*\\*(?=${CJK})`, 'g'), '$1**\u202F')
  return md
}

/**
 * 将 Markdown 转换为带内联样式的微信兼容 HTML
 */
export async function convertMarkdownToHTML(
  markdown: string,
  templateConfig: TemplateConfig
): Promise<ConversionResult> {
  const markerProcessed = preprocessAssetAliasMarkers(
    fixCjkBoldDelimiters(markdown),
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
    .use(rehypeWechatNumberedH2(templateConfig))
    .use(rehypeWechatListBr)
    .use(rehypeFrontmatterMeta(templateConfig))
    .use(rehypeInjectStyles, templateConfig)
    .use(rehypeWechatRenameLists)
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
