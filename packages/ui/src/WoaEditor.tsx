import React, { useEffect } from 'react'
import { ApiConfigProvider } from './context'
import { useInitialize } from './hooks/useInitialize'
import { useAppStore } from './store'
import { Layout } from './components/Layout'
import { MarkdownEditor } from './components/MarkdownEditor'
import { Preview } from './components/Preview'
import { StyleConfigurator } from './components/StyleConfigurator'

interface WoaEditorProps {
  /** Base URL for API calls. Default: '/admin' */
  apiBase?: string
}

function WoaEditorInner() {
  useInitialize()

  const { hasUnsavedChanges } = useAppStore()

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  return (
    <Layout
      left={<StyleConfigurator />}
      center={<MarkdownEditor />}
      right={<Preview />}
    />
  )
}

export function WoaEditor({ apiBase = '/admin' }: WoaEditorProps) {
  return (
    <ApiConfigProvider apiBase={apiBase}>
      <WoaEditorInner />
    </ApiConfigProvider>
  )
}
