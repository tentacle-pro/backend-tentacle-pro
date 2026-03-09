import honoApp from './server/app'
// @ts-ignore — Bun HTML import
import indexHtml from '../index.html'

const PORT = Number(process.env.WEB_PORT ?? 3000)

Bun.serve({
  port: PORT,
  routes: {
    '/auth/*': honoApp.fetch.bind(honoApp),
    '/admin/*': honoApp.fetch.bind(honoApp),
    '/*': indexHtml,
  },
  development: process.env.NODE_ENV !== 'production'
    ? { hmr: true, console: true }
    : undefined,
})

console.log(`🌐 web app running at http://localhost:${PORT}`)
