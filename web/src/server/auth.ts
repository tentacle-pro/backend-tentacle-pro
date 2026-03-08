import { Hono } from 'hono'
import type { MiddlewareHandler } from 'hono'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'
import { sign, verify } from 'hono/jwt'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const JWT_SECRET = process.env.ADMIN_JWT_SECRET ?? 'change-me-in-production'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123'
const COOKIE_NAME = '__session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export const authApp = new Hono()

authApp.post(
  '/login',
  zValidator('json', z.object({ password: z.string() })),
  async (c) => {
    const { password } = c.req.valid('json')

    if (password !== ADMIN_PASSWORD) {
      return c.json({ ok: false, error: { message: 'Invalid password' } }, 401)
    }

    const token = await sign(
      { sub: 'admin', iat: Math.floor(Date.now() / 1000) },
      JWT_SECRET,
    )

    setCookie(c, COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'Lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })

    return c.json({ ok: true, data: { message: 'Logged in' } })
  },
)

authApp.post('/logout', (c) => {
  deleteCookie(c, COOKIE_NAME, { path: '/' })
  return c.json({ ok: true, data: { message: 'Logged out' } })
})

/** Middleware: verify JWT cookie and attach admin identity */
export const requireAdmin: MiddlewareHandler = async (c, next) => {
  const token = getCookie(c, COOKIE_NAME)
  if (!token) {
    return c.json({ ok: false, error: { message: 'Unauthorized' } }, 401)
  }

  try {
    await verify(token, JWT_SECRET, 'HS256')
  } catch {
    deleteCookie(c, COOKIE_NAME, { path: '/' })
    return c.json({ ok: false, error: { message: 'Invalid session' } }, 401)
  }

  await next()
}
