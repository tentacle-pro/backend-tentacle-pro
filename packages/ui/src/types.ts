// packages/ui 的核心类型定义
// Template 类型对齐 packages/db 的 Drizzle 模型（camelCase）

export interface TemplateConfig {
  global?: GlobalConfig
  variables: Record<string, string>
  assets?: Record<string, string>
  styles: Record<string, string>
}

export interface GlobalConfig {
  themeColor?: string
  fontFamily?: string
  baseFontSize?: 'sm' | 'base' | 'lg'
  codeTheme?: 'light' | 'dark' | 'androidstudio'
}

export interface UITemplate {
  id: string
  name: string
  config: TemplateConfig
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface UIAsset {
  id: string
  alias: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  uploadedAt: string
}
