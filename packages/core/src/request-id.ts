/** 生成带时间排序的唯一 request_id */
export function generateRequestId(): string {
  // 时间戳(ms) + 随机 hex，共 24 字符
  const ts = Date.now().toString(36).toUpperCase().padStart(9, '0')
  const rand = Math.random().toString(36).substring(2, 11).toUpperCase().padStart(9, '0')
  return `${ts}${rand}`
}
