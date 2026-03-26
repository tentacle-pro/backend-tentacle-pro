// 模板配置类型（与 packages/db 的 Drizzle 模型对应）

export interface TemplateConfig {
  global?: GlobalConfig
  variables: Record<string, string>   // CSS 变量：如 brandColor, textColor
  assets?: Record<string, string>     // 素材别名：如 divider, listMarker
  styles: Record<string, string>      // HTML 标签名 → TailwindCSS 类名
  meta?: TemplateMeta
}

export interface TemplateMeta {
  presetKey?: string
  presetName?: string
  description?: string
  locked?: boolean
  /** 启用带序号二级标题：`## 01 标题` → 大号锈红序号 + 铜金底边框标题结构 */
  numberedH2?: boolean
}

export interface GlobalConfig {
  themeColor?: string
  fontFamily?: string
  baseFontSize?: 'sm' | 'base' | 'lg'
  codeTheme?: 'light' | 'dark' | 'androidstudio'
}

export interface ConversionResult {
  html: string
  warnings: string[]
}
