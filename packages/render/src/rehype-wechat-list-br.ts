/**
 * rehype-wechat-list-br
 *
 * 微信 Webview 问题：对于"宽松列表项"（loose list item），
 * remark → rehype 生成如下结构：
 *
 *   <li><p><strong>标题</strong>\n正文内容</p></li>
 *
 * 标准浏览器会把 <p> 内的 \n 折叠为空格，正文紧接标题渲染。
 * 但微信 Webview 渲染器行为不一致：
 *   - 当 <strong> 内容较长占满一行时，\n 被渲染为换行，
 *     正文从行首开始，看起来像悬挂缩进；
 *   - 而内容较短时，\n 被折叠，外观不同。
 *
 * 修复：将 <li> 内 <p> 中紧跟在内联元素后的 \n 前缀替换为显式 <br>，
 * 确保微信渲染器行为确定性。
 */

import type { Plugin } from 'unified'
import type { Element, Text, Node } from 'hast'
import { visit } from 'unist-util-visit'

export const rehypeWechatListBr: Plugin = function () {
  return (tree: Node) => {
    // 遍历所有 <li> 元素
    visit(tree, 'element', (liNode: Element) => {
      if (liNode.tagName !== 'li') return

      // 遍历 <li> 内所有 <p>
      for (const child of liNode.children) {
        if (child.type !== 'element') continue
        const p = child as Element
        if (p.tagName !== 'p') continue

        // 处理 <p> 的子节点：
        // 如果某个文本节点的值以 \n 开头，且它的前一个兄弟是元素节点（如 <strong>），
        // 则将 \n 替换为 <br> 节点
        const newChildren: (Element | Text | Node)[] = []
        for (let i = 0; i < p.children.length; i++) {
          const node = p.children[i]!
          const prev = newChildren[newChildren.length - 1]

          if (
            node.type === 'text' &&
            (node as Text).value.startsWith('\n') &&
            prev?.type === 'element'
          ) {
            // 插入 <br>
            newChildren.push({
              type: 'element',
              tagName: 'br',
              properties: {},
              children: [],
            } as Element)
            // 剩余文本（去掉开头的 \n）
            const rest = (node as Text).value.slice(1)
            if (rest.length > 0) {
              newChildren.push({ type: 'text', value: rest } as Text)
            }
          } else {
            newChildren.push(node)
          }
        }
        p.children = newChildren as Element['children']
      }
    })
  }
}
