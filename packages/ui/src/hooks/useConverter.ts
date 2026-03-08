import { useCallback } from 'react'
import { useApiConfig } from '../context'
import { useAppStore } from '../store'

export function useConverter() {
  const { apiBase } = useApiConfig()
  const { markdown, currentTemplate, tempConfig, setHtml, setWarnings, setIsConverting } = useAppStore()

  const convert = useCallback(
    async (md?: string) => {
      const content = md ?? markdown
      if (!currentTemplate) return

      setIsConverting(true)
      try {
        const body: Record<string, unknown> = {
          templateId: currentTemplate.id,
          markdown: content,
        }
        if (tempConfig) {
          body.templateConfig = tempConfig
        }

        const res = await fetch(`${apiBase}/convert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          console.error('[useConverter] convert failed', err)
          return
        }

        const json = await res.json()
        if (json.ok && json.data) {
          setHtml(json.data.html ?? '')
          setWarnings(json.data.warnings ?? [])
        }
      } catch (e) {
        console.error('[useConverter] network error', e)
      } finally {
        setIsConverting(false)
      }
    },
    [apiBase, markdown, currentTemplate, tempConfig, setHtml, setWarnings, setIsConverting],
  )

  return { convert }
}
