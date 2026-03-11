// rehype 插件：微信公众号增强处理
// - Mermaid 代码块 → mermaid.ink 图片
// - LaTeX 公式 → latex.codecogs.com 图片
// - 文末外链收集 → 参考链接章节

import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
import type { Element, Root, Text } from 'hast'

interface LinkRef {
  href: string
  text: string
}

interface HeadingItem {
  level: number
  text: string
  id: string
}

function normalizeLinkText(text: string, href: string): string {
  const cleaned = text.trim().replace(/[：:]+$/g, '').trim()
  return cleaned || href
}

function slugifyHeading(text: string): string {
  const normalized = text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\u4e00-\u9fa5a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return normalized || 'section'
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === 'string') return [value]
  return []
}

function getText(node: Element): string {
  let result = ''
  const walk = (current: Element | Text) => {
    if (current.type === 'text') { result += current.value; return }
    for (const child of (current as Element).children ?? []) {
      if (child.type === 'text' || child.type === 'element') walk(child as Element | Text)
    }
  }
  walk(node)
  return result.trim()
}

function isTocMarker(text: string): boolean {
  const t = text.trim().toLowerCase()
  return t === '@[toc]' || t === '[toc]'
}

function isAlertMarker(text: string): boolean {
  return /^:::[a-z]+[\s\S]*\n:::\s*$/i.test(text.trim())
}

function parseAlertBlock(text: string): { type: string; body: string } | null {
  const m = text.trim().match(/^:::([a-z]+)\s*\n([\s\S]*?)\n:::\s*$/i)
  if (!m) return null
  return { type: m[1]!.toLowerCase(), body: m[2]!.trim() }
}

function rubyNodesFromText(value: string): Array<Element | Text> {
  const pattern = /\[([^\]\n]+)\](?:\{([^}\n]+)\}|\^\(([^)\n]+)\))/g
  const nodes: Array<Element | Text> = []
  let lastIndex = 0
  let matched = false
  for (const match of value.matchAll(pattern)) {
    matched = true
    const full = match[0]!
    const base = match[1]!
    const rt = (match[2] || match[3] || '').trim()
    const start = match.index || 0
    if (start > lastIndex) {
      nodes.push({ type: 'text', value: value.slice(lastIndex, start) })
    }
    nodes.push({
      type: 'element',
      tagName: 'ruby',
      properties: {},
      children: [
        { type: 'text', value: base },
        { type: 'element', tagName: 'rt', properties: {}, children: [{ type: 'text', value: rt }] },
      ],
    })
    lastIndex = start + full.length
  }

  if (!matched) return [{ type: 'text', value }]
  if (lastIndex < value.length) {
    nodes.push({ type: 'text', value: value.slice(lastIndex) })
  }
  return nodes
}

function buildTocNode(headings: HeadingItem[]): Element {
  return {
    type: 'element',
    tagName: 'ul',
    properties: {},
    children: headings.map((item) => ({
      type: 'element' as const,
      tagName: 'li',
      properties: {},
      children: [
        {
          type: 'element' as const,
          tagName: 'a',
          properties: { href: `#${item.id}` },
          children: [{ type: 'text' as const, value: item.text }],
        },
      ],
    })),
  }
}

function createImage(src: string, alt: string): Element {
  return { type: 'element', tagName: 'img', properties: { src, alt }, children: [] }
}

function createParagraphWithImage(src: string, alt: string): Element {
  return {
    type: 'element',
    tagName: 'p',
    properties: {},
    children: [createImage(src, alt)],
  }
}

function createLinkReferencesSection(links: LinkRef[]): Element[] {
  if (links.length === 0) return []
  return [
    { type: 'element', tagName: 'hr', properties: {}, children: [] },
    {
      type: 'element',
      tagName: 'h3',
      properties: {},
      children: [{ type: 'text', value: '参考链接' }],
    },
    {
      type: 'element',
      tagName: 'div',
      properties: {},
      children: links.map((item, index) => ({
        type: 'element' as const,
        tagName: 'p',
        properties: {},
        children: [
          { type: 'text' as const, value: `${index + 1}. ${item.text}：` },
          {
            type: 'element' as const,
            tagName: 'a',
            properties: { href: item.href },
            children: [{ type: 'text' as const, value: item.href }],
          },
        ],
      })),
    },
  ]
}

export const rehypeWechatEnhancements: Plugin<[], Root> = () => {
  return (tree) => {
    const linkMap = new Map<string, LinkRef>()
    const headingCounters = new Map<string, number>()
    const headings: HeadingItem[] = []

    // 第一轮：生成标题 id，并收集 TOC 数据
    visit(tree, 'element', (node: Element) => {
      if (!/^h[1-6]$/.test(node.tagName)) return
      const text = getText(node)
      if (!text) return
      const base = slugifyHeading(text)
      const current = headingCounters.get(base) || 0
      const next = current + 1
      headingCounters.set(base, next)
      const id = next > 1 ? `${base}-${next}` : base
      node.properties = { ...(node.properties || {}), id }
      headings.push({ level: Number(node.tagName[1]), text, id })
    })

    visit(tree, 'element', (node: Element, index, parent) => {
      if (!parent || index === undefined) return

      if (node.tagName === 'p') {
        const paragraphText = getText(node)
        if (isTocMarker(paragraphText)) {
          ;(parent.children as Element[])[index] = buildTocNode(headings.filter((h) => h.level >= 2))
          return
        }
        if (isAlertMarker(paragraphText)) {
          const parsed = parseAlertBlock(paragraphText)
          if (parsed) {
            const titleMap: Record<string, string> = {
              tip: '提示',
              note: '说明',
              warning: '警告',
              caution: '注意',
              info: '信息',
              important: '重点',
            }
            const title = titleMap[parsed.type] || parsed.type.toUpperCase()
            ;(parent.children as Element[])[index] = {
              type: 'element',
              tagName: 'blockquote',
              properties: {},
              children: [
                {
                  type: 'element',
                  tagName: 'p',
                  properties: {},
                  children: [{ type: 'text', value: `${title}：${parsed.body}` }],
                },
              ],
            }
            return
          }
        }
      }

      if (node.tagName === 'a') {
        const href = String(node.properties?.href ?? '')
        if (/^https?:\/\//.test(href)) {
          const text = normalizeLinkText(getText(node), href)
          const existing = linkMap.get(href)
          if (!existing) {
            linkMap.set(href, { href, text })
          } else if (existing.text === href && text !== href) {
            linkMap.set(href, { href, text })
          }
        }
      }

      if (node.tagName === 'pre') {
        const code = node.children?.[0]
        if (!code || code.type !== 'element' || (code as Element).tagName !== 'code') return
        const codeEl = code as Element
        const classNames = asArray(codeEl.properties?.className)
        const codeText = getText(codeEl)

        if (classNames.includes('language-mermaid')) {
          const encoded = Buffer.from(codeText, 'utf-8').toString('base64url')
          ;(parent.children as Element[])[index] = createParagraphWithImage(
            `https://mermaid.ink/img/${encoded}`,
            'mermaid diagram'
          )
          return
        }

        if (classNames.includes('math-display')) {
          const params = '\\dpi{150}\\bg{white}'
          const formula = encodeURIComponent(params + codeText)
          ;(parent.children as Element[])[index] = createParagraphWithImage(
            `https://latex.codecogs.com/png.image?${formula}`,
            `formula: ${codeText}`
          )
        }
      }

      if (node.tagName === 'code') {
        const classNames = asArray(node.properties?.className)
        if (!classNames.includes('math-inline')) return
        const formulaText = getText(node)
        const params = '\\dpi{150}\\bg{white}'
        const formula = encodeURIComponent(params + formulaText)
        ;(parent.children as Element[])[index] = createImage(
          `https://latex.codecogs.com/png.image?${formula}`,
          `formula: ${formulaText}`
        )
      }

      if (node.tagName !== 'code' && node.tagName !== 'pre') {
        node.children = (node.children || []).flatMap((child) => {
          if (child.type !== 'text') return [child]
          return rubyNodesFromText(child.value)
        }) as Element['children']
      }
    })

    const references = createLinkReferencesSection([...linkMap.values()])
    tree.children.push(...(references as typeof tree.children))

    // WeChat list rendering fix:
    // 1. Force list-style:none on <ol>/<ul> to suppress the native WeChat counter.
    //    inject-styles runs after this plugin and only appends — it won't override list-style.
    // 2. Give each <li> display:block so the list-item role is fully removed.
    // 3. Inject manual marker text ("1. " / "• ") so the content still looks like a list.
    visit(tree, 'element', (listNode: Element) => {
      if (listNode.tagName !== 'ol' && listNode.tagName !== 'ul') return
      // Must be set BEFORE inject-styles appends its styles; inline style wins over UA default.
      listNode.properties = listNode.properties || {}
      const listExisting = (listNode.properties.style as string) || ''
      listNode.properties.style = listExisting
        ? `list-style: none; ${listExisting}`
        : 'list-style: none'

      const isOrdered = listNode.tagName === 'ol'
      let counter = 0
      for (const child of listNode.children) {
        if (child.type !== 'element' || (child as Element).tagName !== 'li') continue
        counter++
        const li = child as Element
        li.properties = li.properties || {}
        const existing = (li.properties.style as string) || ''
        li.properties.style = existing
          ? `${existing}; display: block; margin: 0.2em 8px`
          : 'display: block; margin: 0.2em 8px'
        const marker = isOrdered ? `${counter}. ` : '• '
        li.children.unshift({ type: 'text', value: marker } as Text)
      }
    })
  }
}
