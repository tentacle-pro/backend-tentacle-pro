import React from 'react'
import { WoaEditor } from '@tentacle-pro/ui'

export function EditorPage() {
  return (
    <div className="h-full flex-1 flex flex-col overflow-hidden">
      <WoaEditor apiBase="/admin" />
    </div>
  )
}
