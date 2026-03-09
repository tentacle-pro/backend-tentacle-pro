import { AppError, ErrorCode } from '@tentacle-pro/core'
import { getAccessToken, forceRefreshToken } from './token-manager'
import type {
  WxAddMaterialResponse,
  WxUploadImgResponse,
} from './types'
import { WX_ERRCODE } from './types'

const WX_UPLOAD_MATERIAL_URL =
  'https://api.weixin.qq.com/cgi-bin/material/add_material'
const WX_UPLOAD_IMG_URL = 'https://api.weixin.qq.com/cgi-bin/media/uploadimg'

// ─── 辅助 ─────────────────────────────────────────────────────────────────

function isTokenError(errcode: number): boolean {
  return (
    errcode === WX_ERRCODE.ACCESS_TOKEN_INVALID ||
    errcode === WX_ERRCODE.ACCESS_TOKEN_EXPIRED ||
    errcode === WX_ERRCODE.INVALID_CREDENTIAL
  )
}

async function buildFormData(
  mediaFile?: File | Blob,
  imageUrl?: string,
  filename?: string
): Promise<FormData> {
  const form = new FormData()

  if (mediaFile) {
    form.append('media', mediaFile, filename ?? 'image.jpg')
  } else if (imageUrl) {
    const resp = await fetch(imageUrl)
    if (!resp.ok) {
      throw new AppError(
        ErrorCode.WX_400_UPLOAD_FAILED,
        `Failed to fetch image from URL: ${resp.status}`,
        400
      )
    }
    const blob = await resp.blob()
    const name = imageUrl.split('/').pop() ?? 'image.jpg'
    form.append('media', blob, name)
  } else {
    throw new AppError(
      ErrorCode.WX_400_UPLOAD_FAILED,
      'Either media file or image_url must be provided',
      400
    )
  }

  return form
}

// ─── 上传封面图（永久素材）────────────────────────────────────────────────

export async function uploadPermanentImage(
  wechatAccountId: string,
  opts: { mediaFile?: File | Blob; imageUrl?: string; filename?: string }
): Promise<{ mediaId: string; url?: string }> {
  let accessToken = await getAccessToken(wechatAccountId)

  const doUpload = async (token: string): Promise<WxAddMaterialResponse> => {
    const form = await buildFormData(opts.mediaFile, opts.imageUrl, opts.filename)
    const url = `${WX_UPLOAD_MATERIAL_URL}?access_token=${token}&type=image`
    const resp = await fetch(url, { method: 'POST', body: form })
    if (!resp.ok) {
      throw new AppError(
        ErrorCode.WX_400_UPLOAD_FAILED,
        `WeChat upload HTTP error: ${resp.status}`,
        502
      )
    }
    return resp.json() as Promise<WxAddMaterialResponse>
  }

  let result = await doUpload(accessToken)

  // token 失效时重试一次
  if (result.errcode && isTokenError(result.errcode)) {
    accessToken = await forceRefreshToken(wechatAccountId)
    result = await doUpload(accessToken)
  }

  if (result.errcode && result.errcode !== WX_ERRCODE.OK) {
    throw new AppError(
      ErrorCode.WX_400_UPLOAD_FAILED,
      `WeChat upload error ${result.errcode}: ${result.errmsg}`,
      502
    )
  }

  return { mediaId: result.media_id, url: result.url }
}

// ─── 上传正文图（uploadimg）──────────────────────────────────────────────

export async function uploadArticleImage(
  wechatAccountId: string,
  opts: { mediaFile?: File | Blob; imageUrl?: string; filename?: string }
): Promise<string> {
  let accessToken = await getAccessToken(wechatAccountId)

  const doUpload = async (token: string): Promise<WxUploadImgResponse> => {
    const form = await buildFormData(opts.mediaFile, opts.imageUrl, opts.filename)
    const url = `${WX_UPLOAD_IMG_URL}?access_token=${token}`
    const resp = await fetch(url, { method: 'POST', body: form })
    if (!resp.ok) {
      throw new AppError(
        ErrorCode.WX_400_UPLOAD_FAILED,
        `WeChat uploadimg HTTP error: ${resp.status}`,
        502
      )
    }
    return resp.json() as Promise<WxUploadImgResponse>
  }

  let result = await doUpload(accessToken)

  if (result.errcode && isTokenError(result.errcode)) {
    accessToken = await forceRefreshToken(wechatAccountId)
    result = await doUpload(accessToken)
  }

  if (result.errcode && result.errcode !== WX_ERRCODE.OK) {
    throw new AppError(
      ErrorCode.WX_400_UPLOAD_FAILED,
      `WeChat uploadimg error ${result.errcode}: ${result.errmsg}`,
      502
    )
  }

  return result.url
}
