import React, { createContext, useContext } from 'react'

export interface ApiConfig {
  /** API 基础路径，如 "/admin" 或 "https://api.example.com/v1" */
  apiBase: string
}

const ApiConfigContext = createContext<ApiConfig>({ apiBase: '/admin' })

export function ApiConfigProvider({
  children,
  apiBase,
}: {
  children: React.ReactNode
  apiBase: string
}) {
  return (
    <ApiConfigContext.Provider value={{ apiBase }}>
      {children}
    </ApiConfigContext.Provider>
  )
}

export function useApiConfig(): ApiConfig {
  return useContext(ApiConfigContext)
}
