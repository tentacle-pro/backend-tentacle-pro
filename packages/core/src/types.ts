// ─── 通用响应结构 ──────────────────────────────────────────────

export interface ApiResponse<T = undefined> {
  ok: boolean
  request_id: string
  data?: T
  error?: ApiErrorBody
}

export interface ApiErrorBody {
  code: string
  message: string
  details?: unknown
}

// ─── 错误码规范 ────────────────────────────────────────────────

export const ErrorCode = {
  // Auth
  AUTH_401_INVALID_API_KEY: 'AUTH_401_INVALID_API_KEY',
  AUTH_403_BINDING_NOT_FOUND: 'AUTH_403_BINDING_NOT_FOUND',
  // WeChat
  WX_400_UPLOAD_FAILED: 'WX_400_UPLOAD_FAILED',
  WX_401_TOKEN_INVALID: 'WX_401_TOKEN_INVALID',
  WX_429_RATE_LIMIT: 'WX_429_RATE_LIMIT',
  // Render
  RENDER_400_INVALID_TEMPLATE: 'RENDER_400_INVALID_TEMPLATE',
  // System
  SYS_400_BAD_REQUEST: 'SYS_400_BAD_REQUEST',
  SYS_404_NOT_FOUND: 'SYS_404_NOT_FOUND',
  SYS_500_INTERNAL_ERROR: 'SYS_500_INTERNAL_ERROR',
} as const

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode]

// ─── 应用异常 ──────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCodeType,
    message: string,
    public readonly httpStatus: number = 500,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// ─── 端点 DTO ──────────────────────────────────────────────────

export interface Markdown2HtmlRequest {
  markdown: string
  templateId: string
  title?: string
}

export interface Markdown2HtmlResponse {
  html: string
}

export interface UploadPermanentImageResponse {
  media_id: string
}

export interface UploadArticleImageResponse {
  url: string
}

export interface DraftAddRequest {
  title: string
  author?: string
  digest?: string
  content: string
  thumb_media_id: string
  need_open_comment?: 0 | 1
  only_fans_can_comment?: 0 | 1
}

export interface DraftAddResponse {
  media_id: string
}

// ─── 上下文扩展类型 ────────────────────────────────────────────

export interface AuthContext {
  clientId: string
  clientName: string
  wechatAccountId: string
}
