import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface ClientItem {
  client_id: string
  client_name: string
  status: 'active' | 'disabled'
  created_at: string
  wechat_app_id_masked: string
  account_name: string
}

interface CreateClientForm {
  client_id: string
  client_name: string
  wechat_app_id: string
  wechat_app_secret: string
  account_name: string
}

const emptyForm: CreateClientForm = {
  client_id: '',
  client_name: '',
  wechat_app_id: '',
  wechat_app_secret: '',
  account_name: '',
}

export function ClientsPage() {
  const navigate = useNavigate()
  const [clients, setClients] = useState<ClientItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState<CreateClientForm>(emptyForm)
  const [creating, setCreating] = useState(false)
  const [lastApiKey, setLastApiKey] = useState('')
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
  }

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(timer)
  }, [toast])

  const loadClients = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/admin/clients')
      const data = await res.json()
      if (data.ok) {
        setClients(data.data)
      } else {
        setError(data.error?.message || '加载客户失败')
      }
    } catch {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [])

  const updateForm = (key: keyof CreateClientForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const filteredClients = useMemo(() => {
    const keyword = searchText.trim().toLowerCase()
    return clients.filter((item) => {
      const matchesStatus = statusFilter === 'all' ? true : item.status === statusFilter
      if (!matchesStatus) return false
      if (!keyword) return true

      return [item.client_id, item.client_name, item.account_name, item.wechat_app_id_masked]
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    })
  }, [clients, searchText, statusFilter])

  const copyText = async (text: string, successText = '已复制') => {
    try {
      await navigator.clipboard.writeText(text)
      showToast('success', successText)
    } catch {
      showToast('error', '复制失败')
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.wechat_app_id.trim() || !form.wechat_app_secret.trim()) {
      showToast('error', '请填写 APP_ID 与 APP_SECRET')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: form.client_id.trim(),
          client_name: form.client_name.trim(),
          wechat_app_id: form.wechat_app_id.trim(),
          wechat_app_secret: form.wechat_app_secret.trim(),
          account_name: form.account_name.trim(),
        }),
      })

      const data = await res.json()
      if (!data.ok) {
        showToast('error', data.error?.message || '创建失败')
        return
      }

      setLastApiKey(data.data.api_key)
      setForm(emptyForm)
      showToast('success', '客户创建成功，已生成 API_KEY')
      await loadClients()
    } catch {
      showToast('error', '网络错误')
    } finally {
      setCreating(false)
    }
  }

  const toggleStatus = async (item: ClientItem) => {
    const nextStatus = item.status === 'active' ? 'disabled' : 'active'
    const actionText = nextStatus === 'disabled' ? '禁用' : '启用'

    if (!window.confirm(`确认${actionText}客户「${item.client_name}」吗？`)) return

    try {
      const res = await fetch(`/admin/clients/${item.client_id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      const data = await res.json()
      if (!data.ok) {
        showToast('error', data.error?.message || `${actionText}失败`)
        return
      }
      showToast('success', `${actionText}成功`)
      await loadClients()
    } catch {
      showToast('error', '网络错误')
    }
  }

  const regenerateApiKey = async (item: ClientItem) => {
    if (!window.confirm(`确认重新生成「${item.client_name}」的 API_KEY 吗？旧 key 将立即失效。`)) return

    try {
      const res = await fetch(`/admin/clients/${item.client_id}/regenerate-api-key`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!data.ok) {
        showToast('error', data.error?.message || '重新生成失败')
        return
      }

      setLastApiKey(data.data.api_key)
      showToast('success', 'API_KEY 已重新生成')
    } catch {
      showToast('error', '网络错误')
    }
  }

  return (
    <div className="p-6 space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`rounded-md px-3 py-2 text-sm shadow border ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold text-gray-800">客户管理</h1>
        <p className="text-xs text-gray-500 mt-1">
          模板是平台全局共享资源。任意有效 API_KEY 都可通过 templateId 使用任意模板。
        </p>
      </div>

      {lastApiKey && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-blue-800">最新 API_KEY</p>
              <p className="text-xs text-blue-700 mt-1">请复制后发给客户用于调用 API</p>
            </div>
            <button
              onClick={() => copyText(lastApiKey, 'API_KEY 已复制')}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              复制
            </button>
          </div>
          <div className="mt-3 px-3 py-2 rounded border border-blue-200 bg-white font-mono text-xs break-all text-gray-700">
            {lastApiKey}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">新增客户</h2>

        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={form.client_id}
            onChange={(e) => updateForm('client_id', e.target.value)}
            placeholder="客户 ID（如 corp-a）"
            required
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <input
            value={form.client_name}
            onChange={(e) => updateForm('client_name', e.target.value)}
            placeholder="客户名称"
            required
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <input
            value={form.wechat_app_id}
            onChange={(e) => updateForm('wechat_app_id', e.target.value)}
            placeholder="公众号 APP_ID"
            required
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <input
            value={form.account_name}
            onChange={(e) => updateForm('account_name', e.target.value)}
            placeholder="公众号名称（内部标识）"
            required
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <input
            value={form.wechat_app_secret}
            onChange={(e) => updateForm('wechat_app_secret', e.target.value)}
            placeholder="公众号 APP_SECRET"
            required
            className="border border-gray-300 rounded px-3 py-2 text-sm md:col-span-2"
          />

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? '创建中...' : '创建客户并生成 API_KEY'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-sm font-semibold text-gray-700">客户列表</h2>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索客户 ID / 名称 / 公众号"
              className="border border-gray-300 rounded px-3 py-1.5 text-sm min-w-60"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'disabled')}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white"
            >
              <option value="all">全部状态</option>
              <option value="active">仅启用</option>
              <option value="disabled">仅禁用</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="px-4 py-8 text-sm text-gray-500">加载中...</div>
        ) : error ? (
          <div className="px-4 py-8 text-sm text-red-600">{error}</div>
        ) : filteredClients.length === 0 ? (
          <div className="px-4 py-8 text-sm text-gray-400">暂无客户</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm" style={{ minWidth: 820 }}>
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">客户 ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">客户名称</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">公众号</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">APP_ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">状态</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">创建时间</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((item) => (
                  <tr key={item.client_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{item.client_id}</td>
                    <td className="px-4 py-3 text-gray-800">{item.client_name}</td>
                    <td className="px-4 py-3 text-gray-600">{item.account_name || '-'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.wechat_app_id_masked || '-'}</td>
                    <td className="px-4 py-3">
                      {item.status === 'active' ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs bg-green-50 text-green-700">启用</span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">禁用</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(item.created_at).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-4 py-3 space-x-3 whitespace-nowrap">
                      <button
                        onClick={() => toggleStatus(item)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        {item.status === 'active' ? '禁用' : '启用'}
                      </button>
                      <button
                        onClick={() => regenerateApiKey(item)}
                        className="text-xs text-amber-600 hover:text-amber-700"
                      >
                        重新生成 API_KEY
                      </button>
                      <button
                        onClick={() => navigate(`/dashboard/clients/${item.client_id}`)}
                        className="text-xs text-violet-600 hover:text-violet-700"
                      >
                        配置注入
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
