import { Hono } from 'hono'
import type { ApiResponse, UploadPermanentImageResponse, UploadArticleImageResponse } from '@tentacle-pro/core'
import { AppError, ErrorCode } from '@tentacle-pro/core'
import { uploadPermanentImage, uploadArticleImage } from '@tentacle-pro/wechat'
import type { AppVariables } from '../types'

export const uploadRouter = new Hono<{ Variables: AppVariables }>()

// ─── POST /post2wechat/upload/permanent-image ──────────────────────────────

uploadRouter.post('/permanent-image', async (c) => {
  const wechatAccountId = c.get('wechatAccountId')
  const requestId = c.get('requestId')

  const contentType = c.req.header('content-type') ?? ''

  let mediaFile: File | Blob | undefined
  let imageUrl: string | undefined
  let filename: string | undefined

  if (contentType.includes('multipart/form-data')) {
    const form = await c.req.formData()
    const mediaEntry = form.get('media')
    const urlEntry = form.get('image_url')

    if (mediaEntry !== null && typeof mediaEntry !== 'string') {
      mediaFile = mediaEntry as Blob
      filename = (mediaEntry as File).name ?? undefined
    } else if (typeof urlEntry === 'string') {
      imageUrl = urlEntry
    } else {
      throw new AppError(
        ErrorCode.WX_400_UPLOAD_FAILED,
        'Provide either "media" (file) or "image_url" in form data',
        400
      )
    }
  } else {
    // JSON body with image_url
    const body = await c.req.json<{ image_url?: string }>()
    if (!body.image_url) {
      throw new AppError(
        ErrorCode.WX_400_UPLOAD_FAILED,
        'Provide either multipart "media" or JSON "image_url"',
        400
      )
    }
    imageUrl = body.image_url
  }

  const mediaId = await uploadPermanentImage(wechatAccountId, {
    mediaFile,
    imageUrl,
    filename,
  })

  const resp: ApiResponse<UploadPermanentImageResponse> = {
    ok: true,
    request_id: requestId,
    data: { media_id: mediaId },
  }
  return c.json(resp)
})

// ─── POST /post2wechat/upload/article-image ────────────────────────────────

uploadRouter.post('/article-image', async (c) => {
  const wechatAccountId = c.get('wechatAccountId')
  const requestId = c.get('requestId')

  const contentType = c.req.header('content-type') ?? ''

  let mediaFile: File | Blob | undefined
  let imageUrl: string | undefined
  let filename: string | undefined

  if (contentType.includes('multipart/form-data')) {
    const form = await c.req.formData()
    const mediaEntry = form.get('media')
    const urlEntry = form.get('image_url')

    if (mediaEntry !== null && typeof mediaEntry !== 'string') {
      mediaFile = mediaEntry as Blob
      filename = (mediaEntry as File).name ?? undefined
    } else if (typeof urlEntry === 'string') {
      imageUrl = urlEntry
    } else {
      throw new AppError(
        ErrorCode.WX_400_UPLOAD_FAILED,
        'Provide either "media" (file) or "image_url" in form data',
        400
      )
    }
  } else {
    const body = await c.req.json<{ image_url?: string }>()
    if (!body.image_url) {
      throw new AppError(
        ErrorCode.WX_400_UPLOAD_FAILED,
        'Provide either multipart "media" or JSON "image_url"',
        400
      )
    }
    imageUrl = body.image_url
  }

  const url = await uploadArticleImage(wechatAccountId, {
    mediaFile,
    imageUrl,
    filename,
  })

  const resp: ApiResponse<UploadArticleImageResponse> = {
    ok: true,
    request_id: requestId,
    data: { url },
  }
  return c.json(resp)
})
