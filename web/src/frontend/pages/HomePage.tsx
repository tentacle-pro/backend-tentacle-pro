import React from 'react'
import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Tentacle Pro</h1>
        <p className="text-sm text-gray-500 mb-6">内容发布 API 服务</p>
        <Link
          to="/dashboard"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
        >
          控制台
        </Link>
      </div>
      <footer className="py-4 text-center text-xs text-gray-400 space-y-1">
        <p>北京意语相生科技有限公司</p>
        <a
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-600 transition-colors"
        >
          京ICP备2024046813号-1
        </a>
      </footer>
    </div>
  )
}
