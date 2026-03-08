import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

const navItems = [
  { to: '/dashboard/editor', label: '编辑器' },
  { to: '/dashboard/templates', label: '模板管理' },
  { to: '/dashboard/assets', label: '素材管理' },
]

export function DashboardShell() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await fetch('/auth/logout', { method: 'POST' })
    } catch {
      // Ignore
    }
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 bg-gray-900 text-white flex flex-col">
        <div className="px-5 py-4 border-b border-gray-700">
          <h1 className="text-base font-bold tracking-tight">Tentacle Pro</h1>
          <p className="text-xs text-gray-400 mt-0.5">Admin</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 rounded text-sm text-gray-400 hover:bg-gray-700 hover:text-white text-left transition-colors"
          >
            退出登录
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <Outlet />
      </main>
    </div>
  )
}
