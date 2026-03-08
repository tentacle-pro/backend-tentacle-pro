import React from 'react'
import { useAppStore } from '../store'

export function Preview() {
  const { html, warnings, isConverting } = useAppStore()

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">预览</h2>
        {isConverting && <span className="text-xs text-blue-600">转换中...</span>}
      </div>

      {warnings.length > 0 && (
        <div className="mx-4 mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <div className="font-semibold text-yellow-800 mb-1">⚠️ 转换警告：</div>
          <ul className="list-disc list-inside text-yellow-700 space-y-1">
            {warnings.map((warning, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {html ? (
          <div
            id="wechat-output"
            className="wechat-preview"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: intentional – renders pre-sanitized HTML
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            左侧输入 Markdown 后自动生成预览
          </div>
        )}
      </div>
    </div>
  )
}
