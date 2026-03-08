import React from 'react'
import type { PanelImperativeHandle } from 'react-resizable-panels'
import { Copy, Check } from 'lucide-react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './ui/resizable'
import { useAppStore } from '../store'
import { processClipboardContent } from '../lib/clipboard'

interface LayoutProps {
  left: React.ReactNode
  center: React.ReactNode
  right: React.ReactNode
}

export function Layout({ left, center, right }: LayoutProps) {
  const rightPanelRef = React.useRef<PanelImperativeHandle | null>(null)
  const [previewMode, setPreviewMode] = React.useState<'phone' | 'pc'>('phone')
  const [copied, setCopied] = React.useState(false)
  const { html, toast, clearToast } = useAppStore()

  React.useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => {
      clearToast()
    }, 3200)
    return () => clearTimeout(timer)
  }, [toast, clearToast])

  const setPhonePreview = React.useCallback(() => {
    rightPanelRef.current?.resize('30%')
    setPreviewMode('phone')
  }, [])

  const setPcPreview = React.useCallback(() => {
    rightPanelRef.current?.resize('60%')
    setPreviewMode('pc')
  }, [])

  const handleCopy = React.useCallback(async () => {
    if (!html) return

    try {
      const outputElement = document.getElementById('wechat-output')
      if (!outputElement) return

      const clonedElement = outputElement.cloneNode(true) as HTMLElement
      processClipboardContent(outputElement, clonedElement)
      const processedHTML = clonedElement.innerHTML

      if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        const htmlBlob = new Blob([processedHTML], { type: 'text/html' })
        const textBlob = new Blob([clonedElement.textContent || ''], { type: 'text/plain' })

        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': textBlob,
          }),
        ])
      } else {
        const tempDiv = document.createElement('div')
        tempDiv.style.position = 'fixed'
        tempDiv.style.left = '-9999px'
        tempDiv.innerHTML = processedHTML
        document.body.appendChild(tempDiv)

        const range = document.createRange()
        range.selectNodeContents(tempDiv)
        const selection = window.getSelection()
        if (selection) {
          selection.removeAllRanges()
          selection.addRange(range)
          document.execCommand('copy')
          selection.removeAllRanges()
        }

        document.body.removeChild(tempDiv)
      }

      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }, [html])

  return (
    <div className="flex h-full w-full overflow-hidden bg-gray-50">
      <aside className="w-80 shrink-0 border-r border-gray-200 bg-white overflow-y-auto">{left}</aside>

      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        <ResizablePanel defaultSize="70%" minSize="30%">
          <main className="flex h-full min-w-0 flex-col overflow-hidden">{center}</main>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-gray-200" />

        <ResizablePanel panelRef={rightPanelRef} defaultSize="30%" minSize="320px" maxSize="70%">
          <aside className="relative h-full min-w-0 overflow-y-auto border-l border-gray-200 bg-white">
            <div className="absolute right-3 top-3 z-20 flex items-center gap-1 rounded-md border border-gray-200 bg-white/95 p-1 shadow-sm">
              <button
                type="button"
                onClick={setPhonePreview}
                className={`rounded px-2 py-1 text-xs ${previewMode === 'phone' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                手机
              </button>
              <button
                type="button"
                onClick={setPcPreview}
                className={`rounded px-2 py-1 text-xs ${previewMode === 'pc' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                PC
              </button>
              <div className="mx-1 h-4 w-px bg-gray-300" />
              <button
                type="button"
                onClick={handleCopy}
                disabled={!html}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title={copied ? '已复制' : '复制 HTML'}
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" />
                    <span>已复制</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>复制</span>
                  </>
                )}
              </button>
            </div>
            {right}
          </aside>
        </ResizablePanel>
      </ResizablePanelGroup>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-md border border-gray-200 bg-white px-3 py-2 shadow-lg">
          <div
            className={`text-sm ${
              toast.type === 'error'
                ? 'text-red-600'
                : toast.type === 'success'
                  ? 'text-green-600'
                  : 'text-gray-700'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  )
}
