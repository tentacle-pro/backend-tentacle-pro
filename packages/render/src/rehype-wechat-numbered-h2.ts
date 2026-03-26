// rehype 插件：将 `## 01 标题` 格式的 H2 转换为带序号的双 span 结构
//
// 触发条件：templateConfig.meta.numberedH2 === true
//
// 输入 AST(h2):
//   <h2>01 五块支柱基石：为什么是这五个？</h2>
//
// 输出 AST(h2):
//   <h2 data-numbered="true">
//     <span data-role="h2-num">01</span>
//     <span data-role="h2-title">五块支柱基石：为什么是这五个？</span>
//   </h2>
//
// 注：仅当 h2 的第一个子节点为文本、且以 `/^\d{1,3} /` 开头时触发。
// 不影响无序号的普通 h2。

import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
import type { Element, Text } from 'hast'
import type { TemplateConfig } from './types.js'

export function rehypeWechatNumberedH2(config: TemplateConfig): Plugin {
  return function () {
    if (!config.meta?.numberedH2) return

    return (tree: any): void => {
      visit(tree, 'element', (node: Element) => {
        if (node.tagName !== 'h2') return
        if (!node.children.length) return

        const firstChild = node.children[0]
        if (!firstChild || firstChild.type !== 'text') return

        const m = (firstChild as Text).value.match(/^(\d{1,3})\s+(.*)$/)
        if (!m) return

        const numText = m[1]!
        const restText = m[2]!

        // Build title children: optionally remaining text from first node + subsequent nodes
        const titleChildren: Array<Text | Element> = []
        if (restText) {
          titleChildren.push({ type: 'text', value: restText })
        }
        for (const child of node.children.slice(1)) {
          if (child.type === 'text' || child.type === 'element') {
            titleChildren.push(child as Text | Element)
          }
        }

        node.properties = node.properties ?? {}
        node.properties['data-numbered'] = 'true'
        node.children = [
          {
            type: 'element',
            tagName: 'span',
            properties: { 'data-role': 'h2-num' },
            children: [{ type: 'text', value: numText }],
          },
          {
            type: 'element',
            tagName: 'span',
            properties: { 'data-role': 'h2-title' },
            children: titleChildren,
          },
        ]
      })
    }
  }
}
