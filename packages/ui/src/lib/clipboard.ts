// src/lib/clipboard.ts
// 剪贴板处理工具：优化 HTML 以适配微信公众号

const IMPORTANT_STYLE_PROPERTIES = [
  'background-image',
  'background-size',
  'background-repeat',
  'background-position',
  'background-color',
  'color',
  'font-size',
  'font-weight',
  'font-family',
  'font-style',
  'line-height',
  'text-align',
  'text-decoration',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'border',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
  'border-width',
  'border-style',
  'border-color',
  'border-radius',
  'width',
  'max-width',
  'min-width',
  'height',
  'max-height',
  'min-height',
  'display',
  'box-sizing',
  'overflow',
  'overflow-x',
  'overflow-y',
  'white-space',
  'word-break',
  'word-wrap',
  'letter-spacing',
  'opacity',
  'box-shadow',
  'list-style',
  'list-style-type',
  'list-style-position',
  'margin-block',
  'margin-inline',
  'padding-block',
  'padding-inline',
]

function toAbsoluteUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return url
  try {
    return new URL(trimmed, window.location.href).toString()
  } catch {
    return url
  }
}

function extractUrlFromBackgroundImage(backgroundImage: string): string | null {
  const match = backgroundImage.match(/url\((['"]?)(.*?)\1\)/i)
  if (!match || !match[2]) return null
  return match[2].trim()
}

function inlineComputedStyles(sourceElement: HTMLElement, targetElement: HTMLElement): void {
  const computedStyle = window.getComputedStyle(sourceElement)
  const tagName = targetElement.tagName.toLowerCase()
  const parentTag = targetElement.parentElement?.tagName.toLowerCase()

  IMPORTANT_STYLE_PROPERTIES.forEach((prop) => {
    const value = computedStyle.getPropertyValue(prop)

    if (!value || value === 'none' || value === 'normal' || value === 'auto') {
      return
    }

    if (tagName === 'p' && parentTag === 'li') {
      if (prop.startsWith('margin')) {
        targetElement.style.setProperty('margin', '0', 'important')
        return
      }
      if (prop === 'display') {
        targetElement.style.setProperty('display', 'inline', 'important')
        return
      }
    }

    if (tagName === 'li' || tagName === 'ul' || tagName === 'ol') {
      if (prop === 'height' || prop === 'min-height' || prop === 'width' || prop === 'min-width') {
        return
      }

      if (prop === 'list-style-position') {
        return
      }

      if (prop === 'list-style-type') {
        targetElement.style.setProperty(prop, value, 'important')
        return
      }

      if (prop === 'list-style') {
        const listStyleType = computedStyle.getPropertyValue('list-style-type')
        if (listStyleType && listStyleType !== 'none') {
          targetElement.style.setProperty('list-style-type', listStyleType, 'important')
        }
        return
      }

      if (prop === 'margin-block') {
        targetElement.style.setProperty('margin-block', '0', 'important')
        targetElement.style.setProperty('margin-top', '0', 'important')
        targetElement.style.setProperty('margin-bottom', '0', 'important')
        return
      }

      if (prop === 'margin-inline') {
        targetElement.style.setProperty('margin-inline', value, 'important')
        return
      }

      if (prop === 'margin') {
        const marginLeft = computedStyle.getPropertyValue('margin-left')
        const marginRight = computedStyle.getPropertyValue('margin-right')
        if (marginLeft && marginLeft !== '0px') {
          targetElement.style.setProperty('margin-left', marginLeft, 'important')
        }
        if (marginRight && marginRight !== '0px') {
          targetElement.style.setProperty('margin-right', marginRight, 'important')
        }
        targetElement.style.setProperty('margin-top', '0', 'important')
        targetElement.style.setProperty('margin-bottom', '0', 'important')
        return
      }

      if (prop === 'margin-top' || prop === 'margin-bottom') {
        targetElement.style.setProperty(prop, '0', 'important')
        return
      }

      if (prop === 'margin-left' || prop === 'margin-right') {
        targetElement.style.setProperty(prop, value, 'important')
        return
      }

      if (tagName === 'ul' || tagName === 'ol') {
        if (prop === 'padding-block') {
          targetElement.style.setProperty('padding-block', '0', 'important')
          targetElement.style.setProperty('padding-top', '0', 'important')
          targetElement.style.setProperty('padding-bottom', '0', 'important')
          return
        }

        if (prop === 'padding-inline') {
          targetElement.style.setProperty('padding-inline', value, 'important')
          return
        }

        if (prop === 'padding') {
          let paddingLeft = computedStyle.getPropertyValue('padding-left')
          const paddingRight = computedStyle.getPropertyValue('padding-right')
          const paddingLeftNum = parseFloat(paddingLeft || '0')
          if (paddingLeftNum < 20) {
            paddingLeft = '40px'
          }
          targetElement.style.setProperty('padding-left', paddingLeft, 'important')
          if (paddingRight && paddingRight !== '0px') {
            targetElement.style.setProperty('padding-right', paddingRight, 'important')
          }
          targetElement.style.setProperty('padding-top', '0', 'important')
          targetElement.style.setProperty('padding-bottom', '0', 'important')
          return
        }

        if (prop === 'padding-top' || prop === 'padding-bottom') {
          targetElement.style.setProperty(prop, '0', 'important')
          return
        }

        if (prop === 'padding-left') {
          const paddingLeftNum = parseFloat(value || '0')
          const finalValue = paddingLeftNum < 20 ? '40px' : value
          targetElement.style.setProperty(prop, finalValue, 'important')
          return
        }

        if (prop === 'padding-right') {
          targetElement.style.setProperty(prop, value, 'important')
          return
        }
      }
    }

    if (prop === 'width' || prop === 'min-width') {
      return
    }

    if (prop === 'height') {
      const inlineStyle = (sourceElement as HTMLElement).style.height
      if (!inlineStyle) {
        return
      }
    }

    targetElement.style.setProperty(prop, value, 'important')
  })
}

function inlineAllStyles(sourceContainer: HTMLElement, targetContainer: HTMLElement): void {
  inlineComputedStyles(sourceContainer, targetContainer)

  const sourceChildren = sourceContainer.children
  const targetChildren = targetContainer.children

  for (let i = 0; i < sourceChildren.length; i++) {
    const sourceChild = sourceChildren[i] as HTMLElement
    const targetChild = targetChildren[i] as HTMLElement

    if (sourceChild && targetChild) {
      inlineAllStyles(sourceChild, targetChild)
    }
  }
}

function processImages(container: HTMLElement): void {
  const images = container.getElementsByTagName('img')

  Array.from(images).forEach((image) => {
    const src = image.getAttribute('src')
    if (src) {
      image.setAttribute('src', toAbsoluteUrl(src))
    }

    const width = image.getAttribute('width')
    const height = image.getAttribute('height')
    const alt = image.getAttribute('alt') || ''

    if (width) {
      image.removeAttribute('width')
      image.style.width = /^\d+$/.test(width) ? `${width}px` : width
    }

    if (height) {
      image.removeAttribute('height')
      image.style.height = /^\d+$/.test(height) ? `${height}px` : height
    }

    if (alt.startsWith('formula:')) {
      if (!image.style.verticalAlign) {
        image.style.verticalAlign = 'middle'
      }
      if (!image.style.maxWidth) {
        image.style.maxWidth = '100%'
      }
      if (!image.style.display) {
        image.style.display = 'inline-block'
      }
    }

    if (!image.style.maxWidth) {
      image.style.maxWidth = '100%'
    }
  })
}

function convertStyledHrToImage(container: HTMLElement): void {
  const hrElements = container.querySelectorAll('hr')

  hrElements.forEach((hr) => {
    const backgroundImage = hr.style.backgroundImage
    const rawUrl = extractUrlFromBackgroundImage(backgroundImage)
    if (!rawUrl) return

    const dividerUrl = toAbsoluteUrl(rawUrl)
    const replacement = document.createElement('div')

    replacement.style.display = 'block'
    replacement.style.width = hr.style.width || '100%'
    replacement.style.height = hr.style.height || '1px'
    replacement.style.margin = hr.style.margin || ''
    replacement.style.marginTop = hr.style.marginTop || replacement.style.marginTop
    replacement.style.marginRight = hr.style.marginRight || replacement.style.marginRight
    replacement.style.marginBottom = hr.style.marginBottom || replacement.style.marginBottom
    replacement.style.marginLeft = hr.style.marginLeft || replacement.style.marginLeft
    replacement.style.padding = '0'
    replacement.style.border = '0'
    replacement.style.lineHeight = '0'
    replacement.style.boxSizing = 'border-box'

    const img = document.createElement('img')
    img.src = dividerUrl
    img.alt = 'divider'
    img.style.display = 'block'
    img.style.width = '100%'
    img.style.height = '100%'
    img.style.maxWidth = '100%'
    img.style.objectFit = 'fill'
    img.style.border = '0'
    img.style.margin = '0'
    img.style.padding = '0'

    replacement.appendChild(img)
    hr.replaceWith(replacement)
  })
}

function processListStructure(_container: HTMLElement): void {
  // 微信公众号支持标准的嵌套列表，不需要调整结构
}

function convertListParagraphs(container: HTMLElement): void {
  const paragraphs = container.querySelectorAll('p')

  paragraphs.forEach((p) => {
    if (p.parentElement && p.parentElement.tagName.toLowerCase() === 'li') {
      const fragment = document.createDocumentFragment()

      const style = p.style
      const needsSpan = style.color || style.fontWeight || style.textDecoration || style.fontStyle

      let targetContainer: Node = fragment

      if (needsSpan) {
        const span = document.createElement('span')
        if (style.color) span.style.color = style.color
        if (style.fontWeight) span.style.fontWeight = style.fontWeight
        if (style.textDecoration) span.style.textDecoration = style.textDecoration
        if (style.fontStyle) span.style.fontStyle = style.fontStyle

        span.style.display = 'inline'

        fragment.appendChild(span)
        targetContainer = span
      }

      while (p.firstChild) {
        const child = p.firstChild

        if (child.nodeType === Node.TEXT_NODE && child.nodeValue) {
          child.nodeValue = child.nodeValue.replace(/[\n\r\t]+/g, '')
        }

        targetContainer.appendChild(child)
      }

      p.replaceWith(fragment)
    }
  })

  const listItems = container.querySelectorAll('li')
  listItems.forEach((li) => {
    const brs = li.querySelectorAll('br')
    brs.forEach((br) => br.remove())

    const walker = document.createTreeWalker(li, NodeFilter.SHOW_TEXT, null)
    let node
    while ((node = walker.nextNode())) {
      if (node.nodeValue) {
        node.nodeValue = node.nodeValue.replace(/[\n\r\t]+/g, '')
      }
    }
  })
}

function insertZeroWidthSpaceInLists(container: HTMLElement): void {
  const listItems = container.querySelectorAll('li')

  listItems.forEach((li) => {
    const zwsp = document.createTextNode('\u200B')

    if (li.firstChild) {
      li.insertBefore(zwsp, li.firstChild)
    } else {
      li.appendChild(zwsp)
    }
  })
}

function convertSemanticTagsToSpans(container: HTMLElement): void {
  const semanticTags = ['strong', 'b', 'em', 'i']
  const selector = semanticTags.map((tag) => `li ${tag}`).join(', ')

  const elements = container.querySelectorAll(selector)

  elements.forEach((el) => {
    const htmlEl = el as HTMLElement
    const span = document.createElement('span')
    const tagName = htmlEl.tagName.toLowerCase()

    Array.from(htmlEl.attributes).forEach((attr) => {
      span.setAttribute(attr.name, attr.value)
    })

    if (tagName === 'strong' || tagName === 'b') {
      span.style.setProperty('font-weight', 'bold', 'important')
    }
    if (tagName === 'em' || tagName === 'i') {
      span.style.setProperty('font-style', 'italic', 'important')
    }

    span.style.setProperty('display', 'inline', 'important')

    while (htmlEl.firstChild) {
      span.appendChild(htmlEl.firstChild)
    }

    htmlEl.replaceWith(span)
  })
}

function cleanupInlineElementsInLists(container: HTMLElement): void {
  const inlineTags = ['strong', 'b', 'em', 'i', 'span', 'a', 'code', 'label']
  const selector = inlineTags.map((tag) => `li ${tag}`).join(', ')

  const elements = container.querySelectorAll(selector)

  elements.forEach((element) => {
    const el = element as HTMLElement
    const tagName = el.tagName.toLowerCase()

    el.style.setProperty('display', 'inline', 'important')
    el.style.setProperty('width', 'auto', 'important')
    el.style.setProperty('height', 'auto', 'important')
    el.style.setProperty('float', 'none', 'important')
    el.style.setProperty('margin', '0', 'important')

    if (tagName !== 'code' && tagName !== 'pre') {
      el.style.setProperty('white-space', 'normal', 'important')
    }
  })
}

function cleanupListStyles(container: HTMLElement): void {
  const listElements = container.querySelectorAll('ul, ol, li')

  listElements.forEach((element) => {
    const htmlElement = element as HTMLElement
    const tagName = htmlElement.tagName.toLowerCase()

    htmlElement.style.setProperty('white-space', 'normal', 'important')

    if (htmlElement.style.listStylePosition === 'inside') {
      htmlElement.style.removeProperty('list-style-position')
    }

    if (tagName === 'ul' || tagName === 'ol') {
      if (tagName === 'ul' && !htmlElement.style.listStyleType) {
        htmlElement.style.setProperty('list-style-type', 'disc', 'important')
      } else if (tagName === 'ol' && !htmlElement.style.listStyleType) {
        htmlElement.style.setProperty('list-style-type', 'decimal', 'important')
      }

      const paddingLeft = htmlElement.style.paddingLeft
      const paddingLeftNum = parseFloat(paddingLeft || '0')
      if (paddingLeftNum < 20) {
        htmlElement.style.setProperty('padding-left', '40px', 'important')
      }
    }
  })
}

function ensureLeadingTextNodeForBoldListItems(container: HTMLElement): void {
  const listItems = container.querySelectorAll('li')

  listItems.forEach((li) => {
    const firstMeaningfulNode = Array.from(li.childNodes).find((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        return (child.nodeValue || '').trim().length > 0
      }
      return child.nodeType === Node.ELEMENT_NODE
    })

    if (!firstMeaningfulNode || firstMeaningfulNode.nodeType !== Node.ELEMENT_NODE) {
      return
    }

    const element = firstMeaningfulNode as HTMLElement
    const tagName = element.tagName.toLowerCase()
    const isBoldTag = tagName === 'strong' || tagName === 'b'
    const weight = (element.style.fontWeight || '').trim()
    const isBoldWeight = weight === 'bold' || Number.parseInt(weight, 10) >= 600

    if (!isBoldTag && !isBoldWeight) {
      return
    }

    const prev = firstMeaningfulNode.previousSibling
    if (prev && prev.nodeType === Node.TEXT_NODE && (prev.nodeValue || '').length > 0) {
      return
    }

    li.insertBefore(document.createTextNode(' '), firstMeaningfulNode)
  })
}

function flattenLeadingBoldListItemFlow(container: HTMLElement): void {
  const listItems = container.querySelectorAll('li')

  listItems.forEach((li) => {
    const directNestedList = Array.from(li.children).find((child) => {
      const tag = child.tagName.toLowerCase()
      return tag === 'ul' || tag === 'ol'
    })

    if (directNestedList) {
      return
    }

    const firstMeaningfulNode = Array.from(li.childNodes).find((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        return (child.nodeValue || '').trim().length > 0
      }
      return child.nodeType === Node.ELEMENT_NODE
    })

    if (!firstMeaningfulNode || firstMeaningfulNode.nodeType !== Node.ELEMENT_NODE) {
      return
    }

    const firstElement = firstMeaningfulNode as HTMLElement
    const firstTag = firstElement.tagName.toLowerCase()
    const isBoldTag = firstTag === 'strong' || firstTag === 'b'
    const weight = (firstElement.style.fontWeight || '').trim()
    const isBoldWeight = weight === 'bold' || Number.parseInt(weight, 10) >= 600

    if (!isBoldTag && !isBoldWeight) {
      return
    }

    const flow = document.createElement('span')
    flow.style.setProperty('display', 'inline', 'important')
    flow.style.setProperty('white-space', 'normal', 'important')
    flow.style.setProperty('line-height', 'inherit', 'important')

    const nodes = Array.from(li.childNodes)
    nodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
        node.nodeValue = node.nodeValue
          .replace(/[\u0009\u000A\u000D\u2028\u2029]+/g, ' ')
          .replace(/\s+/g, ' ')
      }
      flow.appendChild(node)
    })

    li.appendChild(flow)
  })
}

function normalizeListWhitespaceNodes(container: HTMLElement): void {
  const listItems = container.querySelectorAll('li')

  listItems.forEach((li) => {
    const walker = document.createTreeWalker(li, NodeFilter.SHOW_TEXT, null)
    const textNodes: Text[] = []
    let current = walker.nextNode()

    while (current) {
      textNodes.push(current as Text)
      current = walker.nextNode()
    }

    textNodes.forEach((textNode) => {
      const original = textNode.nodeValue || ''
      const cleaned = original
        .replace(/[\u0009\u000A\u000D\u2028\u2029]+/g, ' ')
        .replace(/\s+/g, ' ')

      if (cleaned.trim().length === 0) {
        textNode.remove()
        return
      }

      textNode.nodeValue = cleaned
    })
  })
}

function createEmptyNode(): HTMLElement {
  const node = document.createElement('p')
  node.style.fontSize = '0'
  node.style.lineHeight = '0'
  node.style.height = '0'
  node.style.margin = '0'
  node.style.padding = '0'
  node.style.border = 'none'
  node.innerHTML = '&nbsp;'
  return node
}

function compactHtmlForWechat(html: string): string {
  const preBlocks: string[] = []

  const withPlaceholders = html.replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/gi, (match) => {
    const index = preBlocks.push(match) - 1
    return `__PRE_BLOCK_${index}__`
  })

  const compacted = withPlaceholders.replace(/[\n\r\t]+/g, '').replace(/>\s+</g, '><')

  return compacted.replace(/__PRE_BLOCK_(\d+)__/g, (_match, idx) => {
    const index = Number.parseInt(idx, 10)
    return preBlocks[index] ?? ''
  })
}

/**
 * 预处理剪贴板内容，对 HTML 进行微信公众号兼容性处理
 * @param sourceElement 源 DOM 元素（用于获取计算样式）
 * @param targetElement 目标克隆元素（用于修改）
 */
export function processClipboardContent(sourceElement: HTMLElement, targetElement: HTMLElement): void {
  inlineAllStyles(sourceElement, targetElement)
  cleanupListStyles(targetElement)
  processImages(targetElement)
  convertStyledHrToImage(targetElement)
  processListStructure(targetElement)
  convertListParagraphs(targetElement)
  convertSemanticTagsToSpans(targetElement)
  normalizeListWhitespaceNodes(targetElement)
  ensureLeadingTextNodeForBoldListItems(targetElement)
  flattenLeadingBoldListItemFlow(targetElement)
  cleanupInlineElementsInLists(targetElement)
  targetElement.innerHTML = compactHtmlForWechat(targetElement.innerHTML)

  const beforeNode = createEmptyNode()
  const afterNode = createEmptyNode()
  targetElement.insertBefore(beforeNode, targetElement.firstChild)
  targetElement.appendChild(afterNode)
}

// insertZeroWidthSpaceInLists is available if needed
export { insertZeroWidthSpaceInLists }
