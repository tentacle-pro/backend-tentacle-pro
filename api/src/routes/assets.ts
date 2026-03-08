import { Hono } from 'hono'
import { findAssetByFilename, listAssets } from '@tentacle-pro/db'
import type { ApiResponse } from '@tentacle-pro/core'
import { AppError, ErrorCode } from '@tentacle-pro/core'
import { join } from 'node:path'
import type { AppVariables } from '../types'

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? join(process.cwd(), 'uploads')

export const assetsRouter = new Hono<{ Variables: AppVariables }>()

/** GET /assets — 列出所有素材元数据 */
assetsRouter.get('/', async (c) => {
  const requestId = c.get('requestId')
  const assets = await listAssets()
  const body: ApiResponse<typeof assets> = { ok: true, request_id: requestId, data: assets }
  return c.json(body)
})

/** GET /assets/:filename — 提供素材文件下载 */
assetsRouter.get('/:filename', async (c) => {
  const filename = c.req.param('filename')

  // 防止路径穿越：文件名不能包含目录分隔符
  if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    throw new AppError(ErrorCode.SYS_400_BAD_REQUEST, 'Invalid filename', 400)
  }

  const asset = await findAssetByFilename(filename)
  if (!asset) {
    throw new AppError(ErrorCode.SYS_404_NOT_FOUND, `Asset "${filename}" not found`, 404)
  }

  const filePath = join(UPLOADS_DIR, filename)
  const file = Bun.file(filePath)
  const exists = await file.exists()
  if (!exists) {
    throw new AppError(ErrorCode.SYS_404_NOT_FOUND, `Asset file missing: ${filename}`, 404)
  }

  return new Response(file, {
    headers: { 'Content-Type': asset.mimeType },
  })
})
