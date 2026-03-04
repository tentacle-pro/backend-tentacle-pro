import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'


const app = new Hono()

app.get('/', (c) => {
  return c.text('You can access: /static/hello.txt')
})

app.use('/static/*', serveStatic({ root: './' }))
app.use('/favicon.ico', serveStatic({ path: './favicon.ico' }))
app.get('*', serveStatic({ path: './static/fallback.txt' }))

export default { 
  port: 3001, 
  fetch: app.fetch, 
}
