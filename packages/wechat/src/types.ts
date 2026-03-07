// ─── 微信 API 基础类型 ─────────────────────────────────────────────

export interface WxTokenResponse {
  access_token: string
  expires_in: number // seconds, typically 7200
  errcode?: number
  errmsg?: string
}

export interface WxAddMaterialResponse {
  media_id: string
  url?: string
  errcode?: number
  errmsg?: string
}

export interface WxUploadImgResponse {
  url: string
  errcode?: number
  errmsg?: string
}

export interface WxDraftAddResponse {
  media_id: string
  errcode?: number
  errmsg?: string
}

export interface WxErrorResponse {
  errcode: number
  errmsg: string
}

// 微信错误码
export const WX_ERRCODE = {
  OK: 0,
  ACCESS_TOKEN_INVALID: 40001,
  ACCESS_TOKEN_EXPIRED: 42001,
  INVALID_CREDENTIAL: 40013,
} as const
