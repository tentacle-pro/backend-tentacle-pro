import { useEffect } from 'react'
import { useApiConfig } from '../context'
import { useAppStore } from '../store'
import { useConverter } from './useConverter'
import type { UITemplate } from '../types'

export function useInitialize() {
  const { apiBase } = useApiConfig()
  const { setTemplates, setCurrentTemplate, setMarkdown } = useAppStore()
  const { convert } = useConverter()

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const res = await fetch(`${apiBase}/templates`)
        if (!res.ok) {
          console.error('[useInitialize] failed to fetch templates', res.status)
          return
        }

        const json = await res.json()
        if (!json.ok || !Array.isArray(json.data)) return

        const templates: UITemplate[] = json.data
        if (cancelled) return

        setTemplates(templates)

        const defaultTemplate = templates.find((t) => t.isDefault) ?? templates[0] ?? null
        if (defaultTemplate) {
          setCurrentTemplate(defaultTemplate)
        }
      } catch (e) {
        console.error('[useInitialize] network error', e)
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [apiBase, setTemplates, setCurrentTemplate])

  // Trigger initial conversion once a template is selected
  const { currentTemplate, markdown } = useAppStore()
  useEffect(() => {
    if (currentTemplate && markdown) {
      convert(markdown)
    }
    // Only run when template first becomes available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTemplate?.id])

  // Expose setMarkdown so callers can set initial markdown from outside
  return { setMarkdown }
}
