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

function normalizeLinkText(text: string, href: string): string {
  const cleaned = text.trim().replace(/[：:]+$/g, '').trim()
  return cleaned || href
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

    visit(tree, 'element', (node: Element, index, parent) => {
      if (!parent || index === undefined) return

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
    })

    const references = createLinkReferencesSection([...linkMap.values()])
    tree.children.push(...(references as typeof tree.children))
  }
}
