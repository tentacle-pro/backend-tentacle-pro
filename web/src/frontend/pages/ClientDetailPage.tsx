import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Injection {
  id: string
  clientId: string
  position: 'header' | 'after_abstract' | 'footer'
  html: string
  enabled: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

type Position = 'header' | 'after_abstract' | 'footer'

const POSITION_LABELS: Record<Position, string> = {
  header: '正文前',
  after_abstract: '首段后',
  footer: '正文后',
}

const POSITION_COLORS: Record<Position, string> = {
  header: 'bg-violet-50 text-violet-700 border-violet-200',
  after_abstract: 'bg-amber-50 text-amber-700 border-amber-200',
  footer: 'bg-teal-50 text-teal-700 border-teal-200',
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  initial?: Injection | null
  onSave: (data: { position: Position; html: string; sort_order: number; enabled: boolean }) => Promise<void>
  onClose: () => void
}

function InjectionModal({ initial, onSave, onClose }: ModalProps) {
  const [position, setPosition] = useState<Position>(initial?.position ?? 'footer')
  const [html, setHtml] = useState(initial?.html ?? '')
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0))
  const [enabled, setEnabled] = useState(initial?.enabled ?? true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!html.trim()) { setErr('内容不能为空'); return }
    setSaving(true)
    setErr('')
    try {
      await onSave({
        position,
        html: html.trim(),
        sort_order: Number(sortOrder) || 0,
        enabled,
      })
      onClose()
    } catch (e: any) {
      setErr(e?.message ?? '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">
            {initial ? '编辑注入片段' : '新增注入片段'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">插入位置</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as Position)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
              >
                <option value="header">正文前 (header)</option>
                <option value="after_abstract">首段后 (after_abstract)</option>
                <option value="footer">正文后 (footer)</option>
              </select>
            </div>
            <div className="w-28">
              <label className="block text-xs font-medium text-gray-600 mb-1">排序权重</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">HTML 代码片段</label>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              rows={8}
              placeholder="输入要注入的纯 HTML 代码..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono resize-y"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="enabled"
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="enabled" className="text-sm text-gray-700">启用此片段</label>
          </div>

          {err && <p className="text-xs text-red-600">{err}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()

  const [injections, setInjections] = useState<Injection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Injection | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => setToast({ type, message })

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(t)
  }, [toast])

  const loadInjections = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/admin/clients/${clientId}/injections`)
      const data = await res.json()
      if (data.ok) {
        setInjections(data.data)
      } else {
        setError(data.error?.message || '加载失败')
      }
    } catch {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadInjections() }, [clientId])

  const handleSave = async (body: { position: Position; html: string; sort_order: number; enabled: boolean }) => {
    if (editing) {
      const res = await fetch(`/admin/clients/${clientId}/injections/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error?.message || '更新失败')
      showToast('success', '已更新')
    } else {
      const res = await fetch(`/admin/clients/${clientId}/injections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error?.message || '创建失败')
      showToast('success', '已创建')
    }
    setEditing(null)
    await loadInjections()
  }

  const handleToggleEnabled = async (item: Injection) => {
    const res = await fetch(`/admin/clients/${clientId}/injections/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !item.enabled }),
    })
    const data = await res.json()
    if (data.ok) {
      showToast('success', item.enabled ? '已禁用' : '已启用')
      await loadInjections()
    } else {
      showToast('error', data.error?.message || '操作失败')
    }
  }

  const handleDelete = async (item: Injection) => {
    if (!window.confirm(`确认删除「${POSITION_LABELS[item.position]}」位置的这条注入片段？`)) return
    const res = await fetch(`/admin/clients/${clientId}/injections/${item.id}`, {
      method: 'DELETE',
    })
    const data = await res.json()
    if (data.ok) {
      showToast('success', '已删除')
      await loadInjections()
    } else {
      showToast('error', data.error?.message || '删除失败')
    }
  }

  const openCreate = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (item: Injection) => { setEditing(item); setModalOpen(true) }

  // Group by position for display order
  const positionOrder: Position[] = ['header', 'after_abstract', 'footer']
  const sorted = [...injections].sort((a, b) => {
    const pa = positionOrder.indexOf(a.position)
    const pb = positionOrder.indexOf(b.position)
    return pa !== pb ? pa - pb : a.sortOrder - b.sortOrder
  })

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`rounded-md px-3 py-2 text-sm shadow border ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {toast.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard/clients')}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ← 客户列表
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-mono text-gray-700">{clientId}</span>
        <span className="text-sm text-gray-500">— 注入内容管理</span>
      </div>

      {/* Injections section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-700">注入片段</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              渲染成 HTML 后，按位置直接插入企业定制代码片段
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + 新增片段
          </button>
        </div>

        {/* Position legend */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex gap-3 text-xs text-gray-500">
          {positionOrder.map((pos) => (
            <span key={pos} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border ${POSITION_COLORS[pos]}`}>
              {POSITION_LABELS[pos]}
            </span>
          ))}
        </div>

        {loading ? (
          <div className="px-4 py-8 text-sm text-gray-500">加载中...</div>
        ) : error ? (
          <div className="px-4 py-8 text-sm text-red-600">{error}</div>
        ) : sorted.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-gray-400">
            暂无注入片段，点击「新增片段」添加
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">位置</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">内容预览</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs w-16">排序</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs w-16">状态</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">操作</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item) => (
                <tr key={item.id} className={`border-b border-gray-100 last:border-0 ${!item.enabled ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded border text-xs ${POSITION_COLORS[item.position]}`}>
                      {POSITION_LABELS[item.position]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600 max-w-xs">
                    <span className="block truncate" title={item.html}>
                      {item.html.slice(0, 80)}{item.html.length > 80 ? '…' : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 text-center">{item.sortOrder}</td>
                  <td className="px-4 py-3">
                    {item.enabled ? (
                      <span className="inline-flex px-2 py-0.5 rounded text-xs bg-green-50 text-green-700">启用</span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">禁用</span>
                    )}
                  </td>
                  <td className="px-4 py-3 space-x-3 whitespace-nowrap">
                    <button
                      onClick={() => openEdit(item)}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleToggleEnabled(item)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      {item.enabled ? '禁用' : '启用'}
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <InjectionModal
          initial={editing}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
