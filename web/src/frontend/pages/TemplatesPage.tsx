import React, { useEffect, useState } from 'react'

interface Template {
  id: string
  name: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/admin/templates')
      const data = await res.json()
      if (data.ok) {
        setTemplates(data.data)
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

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`确认删除模板「${name}」吗？`)) return

    try {
      const res = await fetch(`/admin/templates/${id}`, { method: 'DELETE' })
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

  if (loading) {
    return (
      <div className="p-8 text-gray-500 text-sm">加载中...</div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-red-600 text-sm">{error}</div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-6">模板管理</h1>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">名称</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">状态</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">更新时间</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{t.id}</td>
                <td className="px-4 py-3 text-gray-800">{t.name}</td>
                <td className="px-4 py-3">
                  {t.isDefault ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                      默认
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">自定义</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(t.updatedAt).toLocaleString('zh-CN')}
                </td>
                <td className="px-4 py-3">
                  {!t.isDefault && (
                    <button
                      onClick={() => handleDelete(t.id, t.name)}
                      className="text-red-600 hover:text-red-700 text-xs"
                    >
                      删除
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {templates.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">暂无模板</div>
        )}
      </div>
    </div>
  )
}
