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

// Tailwind v4 内部状态变量默认值（source(none) 跳过 @layer base，需手动补充）
const TW_INTERNAL_DEFAULTS: Record<string, string> = {
  '--tw-border-style': 'solid',
  '--tw-inset-shadow': '0 0 #0000',
  '--tw-inset-ring-shadow': '0 0 #0000',
  '--tw-ring-offset-shadow': '0 0 #0000',
  '--tw-ring-shadow': '0 0 #0000',
}

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

    // 收集主题变量 + 提取样式中的 --* 局部变量，构建完整解析上下文
    const themeVars = collectCssVars(css)
    const localVars: Record<string, string> = {}
    for (const [prop, value] of Object.entries(styles)) {
      if (prop.startsWith('--')) localVars[prop] = value
    }
    const allVars = { ...TW_INTERNAL_DEFAULTS, ...themeVars, ...localVars }

    // 解析所有 var() 引用为具体值，过滤掉自定义属性声明（微信不需要）
    const resolvedStyles: Record<string, string> = {}
    for (const [prop, value] of Object.entries(styles)) {
      if (prop.startsWith('--')) continue
      resolvedStyles[prop] = resolveCssValue(value, allVars)
    }

    const { filtered, warnings } = filterUnsupportedStyles(
      remToPx(simplifyCalcValues(expandLogicalProperties(resolvedStyles)))
    )

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

/**
 * 将内联样式中的 rem 单位换算为 px（1rem = 16px）
 * 微信 WebView 对 rem 单位支持不稳定，呈现差异大，一律换算为 px 更可靠
 */
function remToPx(styles: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [prop, value] of Object.entries(styles)) {
    result[prop] = value.replace(/([-\d.]+)rem/g, (_match, num) => {
      const px = Math.round(parseFloat(num) * 16 * 100) / 100
      return `${px}px`
    })
  }
  return result
}

/**
 * 计算简单的 calc() 乘除表达式，微信 WebView 不支持 calc() 内联样式
 * e.g. calc(0.25rem * 8) → 2rem，calc(100% / 3) → 33.3333%
 */
function simplifyCalcValues(styles: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {}
  const simplify = (expr: string): string => {
    const t = expr.trim()
    // NUMBER_WITH_UNIT * NUMBER
    const m1 = t.match(/^([-\d.]+)(rem|px|em|%|vw|vh)\s*\*\s*([-\d.]+)$/)
    if (m1) {
      const v = Math.round(parseFloat(m1[1]!) * parseFloat(m1[3]!) * 100000) / 100000
      return `${v}${m1[2]}`
    }
    // NUMBER * NUMBER_WITH_UNIT
    const m2 = t.match(/^([-\d.]+)\s*\*\s*([-\d.]+)(rem|px|em|%|vw|vh)$/)
    if (m2) {
      const v = Math.round(parseFloat(m2[1]!) * parseFloat(m2[3]!) * 100000) / 100000
      return `${v}${m2[3]}`
    }
    // NUMBER_WITH_UNIT / NUMBER
    const m3 = t.match(/^([-\d.]+)(rem|px|em|%|vw|vh)\s*\/\s*([-\d.]+)$/)
    if (m3) {
      const v = Math.round(parseFloat(m3[1]!) / parseFloat(m3[3]!) * 100000) / 100000
      return `${v}${m3[2]}`
    }
    return `calc(${expr})`
  }
  for (const [prop, value] of Object.entries(styles)) {
    // 处理每个 calc(…) 子式，不处理嵌套 calc
    result[prop] = value.replace(/calc\(([^()]+)\)/g, (_full, inner) => simplify(inner))
  }
  return result
}

/**
 * 将 CSS 逻辑属性展开为对应物理属性，微信 WebView 不支持逻辑属性，
 * 且会对 margin-block 等生成空列表项等渲染 bug。
 */
function expandLogicalProperties(styles: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [prop, value] of Object.entries(styles)) {
    switch (prop) {
      case 'margin-block':        result['margin-top'] = value;    result['margin-bottom'] = value;  break
      case 'margin-block-start': result['margin-top'] = value;                                     break
      case 'margin-block-end':   result['margin-bottom'] = value;                                  break
      case 'margin-inline':      result['margin-left'] = value;   result['margin-right'] = value;   break
      case 'margin-inline-start':result['margin-left'] = value;                                    break
      case 'margin-inline-end':  result['margin-right'] = value;                                   break
      case 'padding-block':        result['padding-top'] = value;  result['padding-bottom'] = value; break
      case 'padding-block-start':  result['padding-top'] = value;                                   break
      case 'padding-block-end':    result['padding-bottom'] = value;                                break
      case 'padding-inline':       result['padding-left'] = value; result['padding-right'] = value;  break
      case 'padding-inline-start': result['padding-left'] = value;                                  break
      case 'padding-inline-end':   result['padding-right'] = value;                                 break
      case 'inset-block':        result['top'] = value;           result['bottom'] = value;         break
      case 'inset-block-start':  result['top'] = value;                                            break
      case 'inset-block-end':    result['bottom'] = value;                                         break
      case 'inset-inline':       result['left'] = value;          result['right'] = value;          break
      case 'inset-inline-start': result['left'] = value;                                           break
      case 'inset-inline-end':   result['right'] = value;                                          break
      default: result[prop] = value
    }
  }
  return result
}

/** 从生成的 CSS 中收集 :root / :host 的 CSS 自定义属性定义 */
function collectCssVars(css: string): Record<string, string> {
  const vars: Record<string, string> = {}
  try {
    const root = postcss.parse(css)
    root.walkRules((rule) => {
      const sel = rule.selector?.trim().replace(/\s+/g, ' ')
      if (
        sel === ':root' || sel === ':host' ||
        sel === ':root, :host' || sel === ':host, :root'
      ) {
        rule.walkDecls((decl) => {
          if (decl.prop.startsWith('--')) vars[decl.prop] = decl.value
        })
      }
    })
  } catch {}
  return vars
}

/**
 * 递归将 var(--x, fallback) 解析为具体值。
 * 使用状态机正确处理嵌套括号。
 */
function resolveCssValue(value: string, vars: Record<string, string>, depth = 0): string {
  if (depth > 20 || !value.includes('var(')) return value
  let result = ''
  let i = 0
  while (i < value.length) {
    if (value.startsWith('var(', i)) {
      let parenDepth = 1
      let j = i + 4
      while (j < value.length && parenDepth > 0) {
        if (value[j] === '(') parenDepth++
        else if (value[j] === ')') parenDepth--
        j++
      }
      const inner = value.slice(i + 4, j - 1)
      // 找第一个不在嵌套括号内的逗号
      let commaIdx = -1
      let pd = 0
      for (let k = 0; k < inner.length; k++) {
        if (inner[k] === '(') pd++
        else if (inner[k] === ')') pd--
        else if (inner[k] === ',' && pd === 0) { commaIdx = k; break }
      }
      const varName = commaIdx === -1 ? inner.trim() : inner.slice(0, commaIdx).trim()
      const fallback = commaIdx === -1 ? undefined : inner.slice(commaIdx + 1).trim()
      if (vars[varName] !== undefined) {
        result += resolveCssValue(vars[varName]!, vars, depth + 1)
      } else if (fallback !== undefined) {
        result += resolveCssValue(fallback, vars, depth + 1)
      } else {
        result += value.slice(i, j)
      }
      i = j
    } else {
      result += value[i]
      i++
    }
  }
  return result
}
