type ToastType = 'info' | 'success' | 'error'
type ToastFn = (message: string, type?: ToastType) => void

export function getApiErrorMessage(payload: unknown, fallback: string): string {
  if (!payload) return fallback
  if (typeof payload === 'string') return payload
  const p = payload as Record<string, unknown>
  if (typeof p.error === 'string') return p.error
  if (p.error && typeof (p.error as Record<string, unknown>).message === 'string') {
    return String((p.error as Record<string, unknown>).message)
  }
  return fallback
}

export function showActionErrorToast(
  showToast: ToastFn,
  action: string,
  payload: unknown,
  fallback: string,
): string {
  const message = getApiErrorMessage(payload, fallback)
  showToast(`${action}失败：${message}`, 'error')
  return message
}

export function showNetworkErrorToast(showToast: ToastFn, action: string): string {
  const message = '网络错误：无法连接到服务'
  showToast(`${action}失败：${message}`, 'error')
  return message
}
