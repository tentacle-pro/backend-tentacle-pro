/**
 * rehype-wechat-rename-lists
 *
 * WeChat 的后端处理脚本会对 <ol> 元素添加 padding-left: 2.2em（当 li ≥ 5 时触发），
 * 覆盖我们的 padding: 0px inline style，导致不同章节的列表缩进不一致。
 *
 * 此插件在所有样式注入完成后运行，将 <ol>/<ul> 重命名为 <section>，<li> 重命名为 <div>，
 * 使 WeChat 的 ol 特殊处理逻辑无法匹配这些元素。
 */

import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
import type { Root, Element } from 'hast'

export const rehypeWechatRenameLists: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName === 'ol' || node.tagName === 'ul') {
        node.tagName = 'section'
      } else if (node.tagName === 'li') {
        node.tagName = 'div'
      }
    })
  }
}
