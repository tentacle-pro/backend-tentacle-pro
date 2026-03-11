// rehype 插件：将 Tailwind 样式注入为 HTML AST 节点的内联 style 属性

import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
import type { Element } from 'hast'
import { convertTailwindToInline, stylesToString } from './tailwind-to-inline'
import type { GlobalConfig, TemplateConfig } from './types'

interface StyleCache {
  [tagName: string]: Record<string, string>
}

interface TreeData {
  warnings?: string[]
}

const BLOCK_CODE_INNER_RESET: Record<string, string> = {
  'background-color': 'transparent',
  color: 'inherit',
  'padding-top': '0',
  'padding-right': '0',
  'padding-bottom': '0',
  'padding-left': '0',
  'border-radius': '0px',
  'font-size': 'inherit',
  'line-height': 'inherit',
}

export const rehypeInjectStyles: Plugin<[TemplateConfig]> = (config) => {
  return async (tree) => {
    const styleCache: StyleCache = {}
    const allWarnings: string[] = []
    const globalDefaults = buildGlobalStyleDefaults(config.global)
    // global.themeColor is the single authoritative "theme color" knob exposed in the editor UI.
    // It must always override variables.brandColor — even if the preset defines a default brandColor.
    const effectiveVariables = {
      ...config.variables,
      ...(config.global?.themeColor
        ? { brandColor: config.global.themeColor }
        : {}),
    }

    for (const [tagName, tailwindClasses] of Object.entries(config.styles)) {
      try {
        const { styles, warnings } = await convertTailwindToInline(
          tagName,
          tailwindClasses,
          effectiveVariables,
          config.assets || {}
        )
        styleCache[tagName] = mergeWithDefaults(styles, globalDefaults[tagName])
        allWarnings.push(...warnings.map((w) => `[${tagName}] ${w}`))
      } catch (error) {
        const message = error instanceof Error ? error.message : '未知错误'
        allWarnings.push(`[${tagName}] Tailwind 转换失败：${message}`)
      }
    }

    for (const [tagName, defaults] of Object.entries(globalDefaults)) {
      styleCache[tagName] = mergeWithDefaults(styleCache[tagName] || {}, defaults)
    }

    const hrStyles = styleCache.hr
    if (hrStyles?.['background-image'] && !hrStyles['background-size']) {
      styleCache.hr = { ...hrStyles, 'background-size': '100% 100%' }
    }

    visit(tree, 'element', (node: Element, _index, parent: unknown) => {
      const tagName = node.tagName
      let styles = styleCache[tagName]

      if (tagName === 'code') {
        const p = parent as Element | null
        const isInPre =
          p && p.type === 'element' && (p as Element).tagName === 'pre'
        styles = isInPre
          ? BLOCK_CODE_INNER_RESET
          : styleCache['code-inline'] || styleCache.code
      }

      if (styles && Object.keys(styles).length > 0) {
        node.properties = node.properties || {}
        const existing = (node.properties.style as string) || ''
        node.properties.style = existing
          ? `${existing}; ${stylesToString(styles)}`
          : stylesToString(styles)
      }
    })

    if (!tree.data) tree.data = {}
    ;(tree.data as TreeData).warnings = allWarnings
  }
}

// ─── 内部函数 ──────────────────────────────────────────────────────────────

function mergeWithDefaults(
  base: Record<string, string>,
  defaults?: Record<string, string>
): Record<string, string> {
  if (!defaults) return base
  const merged: Record<string, string> = { ...base }
  for (const [key, value] of Object.entries(defaults)) {
    if (merged[key] === undefined || merged[key] === '') merged[key] = value
  }
  return merged
}

function buildGlobalStyleDefaults(global?: GlobalConfig): StyleCache {
  if (!global) return {}

  const defaults: StyleCache = {}
  // 注意：li 不在 textTags 里 —— 有 style 属性的 <li> 会导致微信编辑器插入 spacer 占位 <li>
  // li 的 font-family/font-size 通过继承 ul/ol 获得
  const textTags = ['p', 'blockquote', 'td', 'th']
  const listContainerTags = ['ul', 'ol']
  const titleTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
  const codeTags = ['code', 'pre']

  if (global.fontFamily) {
    for (const tag of [...textTags, ...listContainerTags, ...titleTags, ...codeTags]) {
      defaults[tag] = { ...(defaults[tag] || {}), 'font-family': global.fontFamily }
    }
  }

  if (global.baseFontSize) {
    const sizeMap: Record<NonNullable<GlobalConfig['baseFontSize']>, string> = {
      sm: '14px',
      base: '16px',
      lg: '18px',
    }
    for (const tag of [...textTags, ...listContainerTags]) {
      defaults[tag] = {
        ...(defaults[tag] || {}),
        'font-size': sizeMap[global.baseFontSize],
      }
    }
  }

  if (global.themeColor) {
    defaults.a = { ...(defaults.a || {}), color: global.themeColor }
    defaults.h2 = {
      ...(defaults.h2 || {}),
      'border-left-color': global.themeColor,
    }
  }

  if (global.codeTheme) {
    const themes: Record<
      NonNullable<GlobalConfig['codeTheme']>,
      { pre: Record<string, string>; code: Record<string, string> }
    > = {
      light: {
        pre: { 'background-color': '#f6f8fa', color: '#24292f' },
        code: { 'background-color': '#f3f4f6', color: '#c7254e' },
      },
      dark: {
        pre: { 'background-color': '#1f2937', color: '#e5e7eb' },
        code: { 'background-color': '#111827', color: '#93c5fd' },
      },
      androidstudio: {
        pre: { 'background-color': '#2b2b2b', color: '#a9b7c6' },
        code: { 'background-color': '#2b2b2b', color: '#a9b7c6' },
      },
    }
    const selected = themes[global.codeTheme]
    defaults.pre = { ...(defaults.pre || {}), ...selected.pre }
    defaults.code = { ...(defaults.code || {}), ...selected.code }
  }

  return defaults
}
