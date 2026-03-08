// TailwindCSS 类名 → 内联样式转换器

import postcss from 'postcss'
import tailwindcss from '@tailwindcss/postcss'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

// 微信不支持的 CSS 属性黑名单
const WECHAT_UNSUPPORTED_PROPERTIES = [
  'position',
  'z-index',
  'transform',
  'transform-origin',
  'animation',
  'animation-name',
  'animation-duration',
  'animation-timing-function',
  'animation-delay',
  'animation-iteration-count',
  'animation-direction',
  'animation-fill-mode',
  'animation-play-state',
  'transition',
  'transition-property',
  'transition-duration',
  'transition-timing-function',
  'transition-delay',
]

export interface TailwindConversionResult {
  styles: Record<string, string>
  warnings: string[]
}

/**
 * 将 TailwindCSS 类名转换为内联样式
 */
export async function convertTailwindToInline(
  tagName: string,
  tailwindClasses: string,
  variables: Record<string, string> = {},
  assets: Record<string, string> = {}
): Promise<TailwindConversionResult> {
  try {
    const processedClasses = replaceVariables(tailwindClasses, variables)
    const { classes: classesWithAssets, warnings: aliasWarnings } = replaceAssetAliases(
      processedClasses,
      assets
    )
    const normalizedUrlClasses = normalizeUrlFunctionQuotes(classesWithAssets)
    const cleanedClasses = removeUnsupportedPrefixes(normalizedUrlClasses)
    const css = await generateCSS(cleanedClasses)
    const classList = cleanedClasses.split(/\s+/).filter(Boolean)
    const { styles, matchedClasses } = extractInlineStyles(css, classList)
    const { filtered, warnings } = filterUnsupportedStyles(styles)

    const unresolved = classList.filter((cls) => !matchedClasses.has(cls))
    if (unresolved.length > 0) {
      warnings.push(`未识别的 Tailwind 类：${unresolved.join(', ')}`)
    }

    return { styles: filtered, warnings: [...aliasWarnings, ...warnings] }
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误'
    return {
      styles: {},
      warnings: [`Tailwind 语法错误（${tagName}）：${message}`],
    }
  }
}

export function stylesToString(styles: Record<string, string>): string {
  return Object.entries(styles)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ')
}

// ─── 内部函数 ──────────────────────────────────────────────────────────────

function normalizeUrlFunctionQuotes(classString: string): string {
  return classString.replace(/url\((['"])(.*?)\1\)/g, (_full, _quote, inner) => {
    return `url(${inner})`
  })
}

function replaceAssetAliases(
  classString: string,
  assets: Record<string, string>
): { classes: string; warnings: string[] } {
  const warnings: string[] = []
  const classes = classString.replace(/@bg\(([^)]+)\)/g, (full, aliasRaw) => {
    const alias = String(aliasRaw || '').trim()
    if (!alias) {
      warnings.push('检测到空素材别名：@bg()')
      return full
    }
    const resolved = assets[alias]
    if (!resolved) {
      warnings.push(`素材别名未配置：@bg(${alias})`)
      return full
    }
    return resolved
  })
  return { classes, warnings }
}

function replaceVariables(
  classString: string,
  variables: Record<string, string>
): string {
  let result = classString
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`var\\(--${key}\\)`, 'g')
    result = result.replace(regex, value)
  }
  return result
}

function removeUnsupportedPrefixes(classes: string): string {
  return classes
    .split(/\s+/)
    .filter((cls) => {
      if (/^(hover|focus|active|visited):/.test(cls)) return false
      if (/^(before|after):/.test(cls)) return false
      if (/^(sm|md|lg|xl|2xl):/.test(cls)) return false
      return true
    })
    .join(' ')
}

async function generateCSS(classes: string): Promise<string> {
  const projectRoot = fileURLToPath(new URL('../', import.meta.url))
  const inlineSource = classes.replace(/"/g, '\\"')
  const input = `
@import "tailwindcss" source(none);
@source inline("${inlineSource}");
@tailwind utilities;
`
  const result = await postcss([tailwindcss()]).process(input, {
    from: join(projectRoot, 'virtual.tailwind.css'),
  })
  return result.css
}

function extractInlineStyles(
  css: string,
  classes: string[]
): { styles: Record<string, string>; matchedClasses: Set<string> } {
  const styles: Record<string, string> = {}
  const matchedClasses = new Set<string>()

  try {
    const root = postcss.parse(css)
    root.walkRules((rule) => {
      const selectors = rule.selector?.split(',').map((s) => s.trim()) ?? []
      const isMatched = selectors.some((selector) => {
        if (!selector.startsWith('.')) return false
        const firstSegment = selector.split(/\s|:|>|\+|~/)[0]
        if (!firstSegment) return false
        const className = firstSegment.replace(/^\./, '').replace(/\\/g, '')
        const matched = classes.find(
          (cls) => className === cls || className.includes(cls)
        )
        if (matched) {
          matchedClasses.add(matched)
          return true
        }
        return false
      })
      if (!isMatched) return
      rule.walkDecls((decl) => {
        styles[decl.prop] = decl.value
      })
    })
  } catch (error) {
    console.error('CSS 解析失败:', error)
  }

  return { styles, matchedClasses }
}

function filterUnsupportedStyles(
  styles: Record<string, string>
): { filtered: Record<string, string>; warnings: string[] } {
  const filtered: Record<string, string> = {}
  const warnings: string[] = []

  for (const [property, value] of Object.entries(styles)) {
    const isUnsupported = WECHAT_UNSUPPORTED_PROPERTIES.some(
      (unsupported) =>
        property === unsupported || property.startsWith(unsupported + '-')
    )
    if (isUnsupported) {
      warnings.push(`属性 "${property}: ${value}" 可能被微信过滤`)
    } else {
      filtered[property] = value
    }
  }

  return { filtered, warnings }
}
