import React, { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../store'
import { useConverter } from '../hooks/useConverter'
import { useApiConfig } from '../context'
import { showActionErrorToast, showNetworkErrorToast } from '../lib/ui-feedback'
import type { UITemplate, TemplateConfig } from '../types'

type TagCategory = string

interface CategoryConfig {
  key: TagCategory
  label: string
  tags: string[]
}

const categories: CategoryConfig[] = [
  { key: 'h1', label: '标题类', tags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] },
  { key: 'p', label: '段落类', tags: ['p', 'blockquote'] },
  { key: 'hr', label: '分隔线', tags: ['hr'] },
  { key: 'ul', label: '列表类', tags: ['ul', 'ol', 'li'] },
  { key: 'a', label: '链接与强调', tags: ['a', 'strong', 'em'] },
  { key: 'pre', label: '代码块', tags: ['pre', 'code-inline'] },
  { key: 'img', label: '图片', tags: ['img'] },
]

const fontFamilyOptions = [
  {
    label: '系统默认',
    value: 'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
  },
  { label: '衬线', value: 'Georgia, "Times New Roman", "Songti SC", serif' },
  { label: '无衬线', value: 'Arial, "Helvetica Neue", "PingFang SC", sans-serif' },
  { label: '等宽', value: 'Menlo, Monaco, Consolas, "Liberation Mono", monospace' },
]
const DEFAULT_FONT_FAMILY = 'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif'

const baseFontSizeOptions = [
  { label: '偏小（14px）', value: 'sm' },
  { label: '标准（16px）', value: 'base' },
  { label: '偏大（18px）', value: 'lg' },
]

const codeThemeOptions = [
  { label: 'Android Studio', value: 'androidstudio' },
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' },
]

export function StyleConfigurator() {
  const { apiBase } = useApiConfig()
  const {
    currentTemplate,
    templates,
    tempConfig,
    markdown,
    setCurrentTemplate,
    setTemplates,
    setTempConfig,
    setHasUnsavedChanges,
    showToast,
  } = useAppStore()
  const { convert } = useConverter()

  const [openCategory, setOpenCategory] = useState<string | null>('h1')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'saveAs' | 'rename' | null>(null)
  const [templateNameInput, setTemplateNameInput] = useState('')
  const menuRef = useRef<HTMLDivElement | null>(null)

  const config: TemplateConfig = tempConfig ||
    currentTemplate?.config || { global: {}, variables: {}, styles: {} }
  const globalConfig = config.global || {}
  const isDefaultTemplate = currentTemplate?.isDefault === true

  const toastApiError = (action: string, payload: unknown, fallback: string) =>
    showActionErrorToast(showToast, action, payload, fallback)
  const toastNetError = (action: string) => showNetworkErrorToast(showToast, action)

  async function copyText(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        return true
      }
    } catch {
      // fallback below
    }
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.setAttribute('readonly', 'true')
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(textarea)
      return ok
    } catch {
      return false
    }
  }

  function confirmDiscardIfNeeded(message: string): boolean {
    const { hasUnsavedChanges } = useAppStore.getState()
    if (!hasUnsavedChanges) return true
    return window.confirm(message)
  }

  async function refreshTemplatesAndSwitch(targetTemplateId?: string) {
    const res = await fetch(`${apiBase}/templates`)
    const data = await res.json()
    if (!data.ok) throw new Error('获取模板列表失败')

    const latestTemplates: UITemplate[] = data.data ?? []
    setTemplates(latestTemplates)

    let nextTemplate: UITemplate | null = null
    if (targetTemplateId) {
      nextTemplate = latestTemplates.find((t) => t.id === targetTemplateId) ?? null
    }
    if (!nextTemplate) {
      nextTemplate = latestTemplates.find((t) => t.isDefault) ?? latestTemplates[0] ?? null
    }

    setCurrentTemplate(nextTemplate)
    setTempConfig(null)
    setHasUnsavedChanges(false)
    await convert()
  }

  async function validateConfigBeforeSave(): Promise<boolean> {
    if (!currentTemplate) return false

    try {
      const res = await fetch(`${apiBase}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: currentTemplate.id,
          markdown: markdown || '校验',
          templateConfig: config,
        }),
      })

      const data = await res.json()
      if (!data.ok) {
        toastApiError('样式校验', data, '转换失败')
        return false
      }

      const warnings: string[] = data.data?.warnings ?? []
      const tailwindError = warnings.find((w) =>
        /未识别的 Tailwind 类|Tailwind 语法错误|Tailwind 转换失败/.test(w),
      )
      if (tailwindError) {
        showToast(`样式校验未通过：${tailwindError}`, 'error')
        return false
      }

      return true
    } catch {
      toastNetError('样式校验')
      return false
    }
  }

  function buildTemplateIdFromName(name: string): string {
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-\u4e00-\u9fa5]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    const prefix = slug || 'template'
    return `${prefix}-${Date.now()}`
  }

  async function handleTemplateSelect(templateId: string) {
    if (templateId === currentTemplate?.id) return
    const ok = confirmDiscardIfNeeded('当前有未保存修改，切换模板将丢失这些修改，是否继续？')
    if (!ok) return
    const next = templates.find((t) => t.id === templateId) ?? null
    if (!next) return
    setCurrentTemplate(next)
    setTempConfig(null)
    setHasUnsavedChanges(false)
    await convert()
  }

  const handleStyleChange = (tag: string, value: string) => {
    setTempConfig({ ...config, styles: { ...config.styles, [tag]: value } })
    setHasUnsavedChanges(true)
  }

  const handleGlobalChange = (
    key: 'themeColor' | 'fontFamily' | 'baseFontSize' | 'codeTheme',
    value: string,
  ) => {
    setTempConfig({ ...config, global: { ...(config.global || {}), [key]: value } })
    setHasUnsavedChanges(true)
  }

  const handleStyleBlur = async () => {
    await convert()
  }

  const handlePrimarySave = async () => {
    if (!currentTemplate) return
    if (isDefaultTemplate) {
      setTemplateNameInput('')
      setDialogMode('saveAs')
      return
    }

    const isValid = await validateConfigBeforeSave()
    if (!isValid) return

    try {
      const res = await fetch(`${apiBase}/templates/${currentTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: currentTemplate.name, config }),
      })
      const data = await res.json()
      if (!data.ok) {
        toastApiError('保存模板', data, '保存模板失败')
        return
      }
      await refreshTemplatesAndSwitch(currentTemplate.id)
      showToast(`模板「${currentTemplate.name}」保存成功`, 'success')
    } catch {
      toastNetError('保存模板')
    }
  }

  const handleDeleteTemplate = async () => {
    if (!currentTemplate || isDefaultTemplate) return
    const proceed = confirmDiscardIfNeeded(
      '当前有未保存修改，删除并切换模板将丢失这些修改，是否继续？',
    )
    if (!proceed) return
    const ok = window.confirm(`确认删除模板「${currentTemplate.name}」吗？`)
    if (!ok) return

    try {
      const res = await fetch(`${apiBase}/templates/${currentTemplate.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.ok) {
        toastApiError('删除模板', data, '删除模板失败')
        return
      }
      await refreshTemplatesAndSwitch()
      setIsMenuOpen(false)
      showToast(`模板「${currentTemplate.name}」已删除`, 'success')
    } catch {
      toastNetError('删除模板')
    }
  }

  const handleDialogConfirm = async () => {
    if (!currentTemplate || !dialogMode) return
    const normalizedName = templateNameInput.trim()
    if (!normalizedName) {
      showToast('模板名不能为空', 'error')
      return
    }
    const isNameTaken = templates.some(
      (t) =>
        t.name.trim().toLowerCase() === normalizedName.toLowerCase() && t.id !== currentTemplate.id,
    )
    if (isNameTaken) {
      showToast('模板名已存在，请更换名称', 'error')
      return
    }

    const isValid = await validateConfigBeforeSave()
    if (!isValid) return

    try {
      if (dialogMode === 'saveAs') {
        const res = await fetch(`${apiBase}/templates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: buildTemplateIdFromName(normalizedName),
            name: normalizedName,
            config,
          }),
        })
        const data = await res.json()
        if (!data.ok) {
          toastApiError('另存为模板', data, '另存为失败')
          return
        }
        setDialogMode(null)
        await refreshTemplatesAndSwitch(data.data?.id)
        showToast(`模板已另存为「${normalizedName}」`, 'success')
      } else if (dialogMode === 'rename') {
        const res = await fetch(`${apiBase}/templates/${currentTemplate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: normalizedName, config }),
        })
        const data = await res.json()
        if (!data.ok) {
          toastApiError('模板改名', data, '改名失败')
          return
        }
        setDialogMode(null)
        await refreshTemplatesAndSwitch(currentTemplate.id)
        showToast(`模板已改名为「${normalizedName}」`, 'success')
      }
    } catch {
      toastNetError(dialogMode === 'saveAs' ? '另存为模板' : '模板改名')
    }
  }

  const handleCopyCurlCommand = async () => {
    if (!currentTemplate) return
    const convertApiUrl = `${window.location.origin}${apiBase}/convert`
    const curlCommand = `curl -X POST "${convertApiUrl}" -H "Content-Type: application/json" -d '${JSON.stringify({
      templateId: currentTemplate.id,
      markdown: '# Hello\n\nThis is a demo.',
    })}'`
    const ok = await copyText(curlCommand)
    showToast(ok ? 'curl 命令已复制到剪贴板' : '复制 curl 命令失败', ok ? 'success' : 'error')
  }

  const toggleCategory = (categoryKey: string) => {
    setOpenCategory(openCategory === categoryKey ? null : categoryKey)
  }

  const getStyleValue = (tag: string): string => {
    if (tag === 'code-inline') {
      return config.styles['code-inline'] || config.styles['code'] || ''
    }
    return config.styles[tag] || ''
  }

  const getTagLabel = (tag: string): string => {
    if (tag === 'code-inline') return 'code-inline（行内代码）'
    return tag
  }

  useEffect(() => {
    if (!isMenuOpen) return
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  return (
    <div className="flex flex-col h-full">
      {/* 模板选择 */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">样式配置</h2>
        <select
          className="w-full text-sm border border-gray-300 rounded px-2 py-1"
          value={currentTemplate?.id || ''}
          onChange={(e) => handleTemplateSelect(e.target.value)}
        >
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
              {template.isDefault ? '（默认）' : ''}
            </option>
          ))}
        </select>

        <div className="mt-2 rounded bg-gray-50 px-2 py-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-gray-600 truncate">
              templateId: {currentTemplate?.id || '-'}
            </span>
            <button
              type="button"
              onClick={handleCopyCurlCommand}
              disabled={!currentTemplate?.id}
              className="shrink-0 text-[11px] text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              复制 cURL
            </button>
          </div>
        </div>
      </div>

      {/* 配置区 */}
      <div className="flex-1 overflow-y-auto">
        {/* 全局配置 */}
        <div className="px-4 py-3 border-b border-gray-200 bg-white space-y-3">
          <h3 className="text-xs font-semibold text-gray-700">全局配置</h3>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">主题色</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={globalConfig.themeColor || '#2563eb'}
                onChange={(e) => handleGlobalChange('themeColor', e.target.value)}
                onBlur={handleStyleBlur}
                className="h-7 w-10 border border-gray-300 rounded bg-white"
              />
              <input
                type="text"
                value={globalConfig.themeColor || ''}
                onChange={(e) => handleGlobalChange('themeColor', e.target.value)}
                onBlur={handleStyleBlur}
                placeholder="#2563eb"
                className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">字体</label>
            <select
              value={globalConfig.fontFamily || DEFAULT_FONT_FAMILY}
              onChange={(e) => handleGlobalChange('fontFamily', e.target.value)}
              onBlur={handleStyleBlur}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
            >
              {fontFamilyOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">字号</label>
            <select
              value={globalConfig.baseFontSize || 'base'}
              onChange={(e) => handleGlobalChange('baseFontSize', e.target.value)}
              onBlur={handleStyleBlur}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
            >
              {baseFontSizeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">代码块主题</label>
            <select
              value={globalConfig.codeTheme || 'androidstudio'}
              onChange={(e) => handleGlobalChange('codeTheme', e.target.value)}
              onBlur={handleStyleBlur}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
            >
              {codeThemeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 各标签样式 */}
        {categories.map((category) => (
          <div key={category.key} className="border-b border-gray-200">
            <button
              onClick={() => toggleCategory(category.key)}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">{category.label}</span>
              <span className="text-gray-400">{openCategory === category.key ? '−' : '+'}</span>
            </button>

            {openCategory === category.key && (
              <div className="px-4 py-3 space-y-3 bg-white">
                {category.tags.map((tag) => (
                  <div key={tag}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {getTagLabel(tag)}
                    </label>
                    <input
                      type="text"
                      value={getStyleValue(tag)}
                      onChange={(e) => handleStyleChange(tag, e.target.value)}
                      onBlur={handleStyleBlur}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="输入 TailwindCSS 类名"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 保存操作区 */}
      <div className="px-4 py-3 border-t border-gray-200 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={handlePrimarySave}
            className="flex-1 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            {isDefaultTemplate ? '另存为' : '保存模板'}
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="w-10 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
              title="更多操作"
            >
              ⋯
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 bottom-12 w-36 rounded border border-gray-200 bg-white shadow-md z-20">
                <button
                  onClick={() => {
                    setTemplateNameInput('')
                    setDialogMode('saveAs')
                    setIsMenuOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                >
                  另存为
                </button>
                <button
                  onClick={() => {
                    if (!currentTemplate || isDefaultTemplate) return
                    setTemplateNameInput(currentTemplate.name)
                    setDialogMode('rename')
                    setIsMenuOpen(false)
                  }}
                  disabled={isDefaultTemplate}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  改名
                </button>
                <button
                  onClick={handleDeleteTemplate}
                  disabled={isDefaultTemplate}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  删除
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 对话框：另存为 / 改名 */}
      {dialogMode && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="w-80 rounded-lg bg-white p-4 shadow-lg">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              {dialogMode === 'saveAs' ? '另存为模板' : '模板改名'}
            </h3>
            <input
              autoFocus
              type="text"
              value={templateNameInput}
              onChange={(e) => setTemplateNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDialogConfirm()}
              placeholder="请输入模板名"
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDialogMode(null)}
                className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleDialogConfirm}
                className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
