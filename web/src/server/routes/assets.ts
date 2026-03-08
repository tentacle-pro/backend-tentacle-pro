import { Hono } from 'hono'
import { getDb, renderAssets, listAssets } from '@tentacle-pro/db'
import { eq } from '@tentacle-pro/db'
import { join, resolve, basename, extname } from 'node:path'
import { requireAdmin } from '../auth'

function genId(): string {
  return crypto.randomUUID().replaceAll('-', '').slice(0, 21)
}

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? join(process.cwd(), 'uploads')
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
])
const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB

export const adminAssetsApp = new Hono()

// All routes require admin auth
adminAssetsApp.use('*', requireAdmin)

adminAssetsApp.get('/', async (c) => {
  const rows = await listAssets()
  return c.json({ ok: true, data: rows })
})

adminAssetsApp.get('/:filename', async (c) => {
  const filename = c.req.param('filename')

  // Path traversal guard
  const safePath = resolve(UPLOADS_DIR, basename(filename))
  if (!safePath.startsWith(resolve(UPLOADS_DIR))) {
    return c.json({ ok: false, error: { message: 'Forbidden' } }, 403)
  }

  const file = Bun.file(safePath)
  const exists = await file.exists()
  if (!exists) {
    return c.json({ ok: false, error: { message: 'Not found' } }, 404)
  }

  return new Response(file)
})

adminAssetsApp.post('/', async (c) => {
  const formData = await c.req.formData()
  const file = formData.get('file') as File | null
  const alias = (formData.get('alias') as string | null)?.trim()

  if (!file || !(file instanceof File)) {
    return c.json({ ok: false, error: { message: 'Missing file field' } }, 400)
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return c.json(
      { ok: false, error: { message: `Unsupported file type: ${file.type}` } },
      400,
    )
  }

  if (file.size > MAX_FILE_BYTES) {
    return c.json({ ok: false, error: { message: 'File size exceeds 10 MB limit' } }, 400)
  }

  if (!alias) {
    return c.json({ ok: false, error: { message: 'Missing alias field' } }, 400)
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(alias)) {
    return c.json(
      { ok: false, error: { message: 'alias must only contain letters, numbers, _ and -' } },
      400,
    )
  }

  const ext = extname(file.name) || ''
  const filename = `${genId()}${ext}`
  const destPath = join(UPLOADS_DIR, filename)

  // Ensure uploads dir exists
  await Bun.write(destPath, await file.arrayBuffer())

  const url = `/admin/assets/${filename}`
  const id = genId()

  const db = getDb()
  const [row] = await db
    .insert(renderAssets)
    .values({
      id,
      alias,
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      url,
    })
    .returning()

  return c.json({ ok: true, data: row }, 201)
})

adminAssetsApp.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const db = getDb()

  const [row] = await db
    .delete(renderAssets)
    .where(eq(renderAssets.id, id))
    .returning()

  if (!row) {
    return c.json({ ok: false, error: { message: 'Asset not found' } }, 404)
  }

  // Best-effort file deletion
  try {
    const filePath = join(UPLOADS_DIR, row.filename)
    const file = Bun.file(filePath)
    if (await file.exists()) {
      // Bun doesn't have Bun.file.delete, use fs
      const { unlink } = await import('node:fs/promises')
      await unlink(filePath)
    }
  } catch {
    // Non-fatal
  }

  return c.json({ ok: true, data: { id: row.id } })
})
