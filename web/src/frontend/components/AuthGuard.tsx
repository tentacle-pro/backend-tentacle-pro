import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Probe any admin endpoint to check if session is valid
    fetch('/admin/templates')
      .then((res) => {
        if (res.status === 401) {
          navigate('/login', { replace: true })
        }
      })
      .catch(() => {
        navigate('/login', { replace: true })
      })
      .finally(() => setChecking(false))
  }, [navigate])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">验证中...</p>
      </div>
    )
  }

  return <>{children}</>
}
