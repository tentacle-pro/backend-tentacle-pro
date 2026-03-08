import React, { useEffect, useRef, useState } from 'react'

interface Asset {
  id: string
  alias: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  uploadedAt: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [aliasInput, setAliasInput] = useState('')
  const [fileInputKey, setFileInputKey] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/admin/assets')
      const data = await res.json()
      if (data.ok) {
        setAssets(data.data)
      } else {
        setError(data.error?.message || '加载失败')
      }
    } catch {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleUpload = async () => {
    if (!selectedFile) return alert('请先选择文件')
    if (!aliasInput.trim()) return alert('请先填写别名')

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('alias', aliasInput.trim())

      const res = await fetch('/admin/assets', { method: 'POST', body: formData })
      const data = await res.json()

      if (data.ok) {
        setSelectedFile(null)
        setAliasInput('')
        setFileInputKey((k) => k + 1)
        await load()
      } else {
        alert(data.error?.message || '上传失败')
      }
    } catch {
      alert('网络错误')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (asset: Asset) => {
    if (!window.confirm(`确认删除素材「${asset.originalName}」吗？`)) return

    try {
      const res = await fetch(`/admin/assets/${asset.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.ok) {
        await load()
      } else {
        alert(data.error?.message || '删除失败')
      }
    } catch {
      alert('网络错误')
    }
  }

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${url}`)
      alert('URL 已复制')
    } catch {
      alert('复制失败')
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-6">素材管理</h1>

      {/* Upload section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">上传素材</h2>
        <p className="text-xs text-gray-500 mb-3">
          支持 JPEG、PNG、GIF、WebP、SVG，最大 10 MB。上传后通过别名在模板中引用。
        </p>

        <div className="flex flex-wrap gap-3 items-center">
          <input
            key={fileInputKey}
            type="file"
            accept="image/*"
            ref={fileRef}
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
          <input
            type="text"
            value={aliasInput}
            onChange={(e) => setAliasInput(e.target.value)}
            placeholder="别名（如 divider）"
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? '上传中...' : '上传'}
          </button>
        </div>

        {selectedFile && (
          <p className="mt-2 text-xs text-gray-600">已选择：{selectedFile.name}（{formatBytes(selectedFile.size)}）</p>
        )}
      </div>

      {/* Assets table */}
      {loading ? (
        <div className="text-gray-500 text-sm">加载中...</div>
      ) : error ? (
        <div className="text-red-600 text-sm">{error}</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">别名</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">原始文件名</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">类型</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">大小</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">上传时间</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-blue-700 bg-blue-50">{a.alias}</td>
                  <td className="px-4 py-3 text-gray-800">{a.originalName}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{a.mimeType}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatBytes(a.size)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(a.uploadedAt).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-4 py-3 flex gap-3">
                    <button
                      onClick={() => copyUrl(a.url)}
                      className="text-blue-600 hover:text-blue-700 text-xs"
                    >
                      复制 URL
                    </button>
                    <button
                      onClick={() => handleDelete(a)}
                      className="text-red-600 hover:text-red-700 text-xs"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {assets.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">暂无素材</div>
          )}
        </div>
      )}
    </div>
  )
}
