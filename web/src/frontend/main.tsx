import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { EditorPage } from './pages/EditorPage'
import { TemplatesPage } from './pages/TemplatesPage'
import { AssetsPage } from './pages/AssetsPage'
import { ClientsPage } from './pages/ClientsPage'
import { DashboardShell } from './components/DashboardShell'
import { AuthGuard } from './components/AuthGuard'

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <DashboardShell />
            </AuthGuard>
          }
        >
          <Route index element={<Navigate to="editor" replace />} />
          <Route path="editor" element={<EditorPage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="assets" element={<AssetsPage />} />
          <Route path="clients" element={<ClientsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
