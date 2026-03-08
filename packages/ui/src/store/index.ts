import { create } from 'zustand'
import type { UITemplate, TemplateConfig } from '../types'
import { DEFAULT_MARKDOWN } from '../lib/preset-markdown'

interface AppState {
  currentTemplate: UITemplate | null
  setCurrentTemplate: (template: UITemplate | null) => void

  templates: UITemplate[]
  setTemplates: (templates: UITemplate[]) => void

  markdown: string
  setMarkdown: (markdown: string) => void

  html: string
  setHtml: (html: string) => void

  warnings: string[]
  setWarnings: (warnings: string[]) => void

  isConverting: boolean
  setIsConverting: (isConverting: boolean) => void

  hasUnsavedChanges: boolean
  setHasUnsavedChanges: (hasChanges: boolean) => void

  tempConfig: TemplateConfig | null
  setTempConfig: (config: TemplateConfig | null) => void

  toast: { message: string; type: 'info' | 'success' | 'error' } | null
  showToast: (message: string, type?: 'info' | 'success' | 'error') => void
  clearToast: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentTemplate: null,
  templates: [],
  markdown: DEFAULT_MARKDOWN,
  html: '',
  warnings: [],
  isConverting: false,
  hasUnsavedChanges: false,
  tempConfig: null,
  toast: null,

  setCurrentTemplate: (template) => set({ currentTemplate: template }),
  setTemplates: (templates) => set({ templates }),
  setMarkdown: (markdown) => set({ markdown }),
  setHtml: (html) => set({ html }),
  setWarnings: (warnings) => set({ warnings }),
  setIsConverting: (isConverting) => set({ isConverting }),
  setHasUnsavedChanges: (hasChanges) => set({ hasUnsavedChanges: hasChanges }),
  setTempConfig: (config) => set({ tempConfig: config }),
  showToast: (message, type = 'info') => set({ toast: { message, type } }),
  clearToast: () => set({ toast: null }),
}))
