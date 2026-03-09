import { Hono } from 'hono'
import { authApp } from './auth'
import { adminTemplatesApp } from './routes/templates'
import { adminAssetsApp } from './routes/assets'
import { adminConvertApp } from './routes/convert'
import { adminClientsApp } from './routes/clients'

const app = new Hono()

// Public: auth routes
app.route('/auth', authApp)

// Protected: admin routes
app.route('/admin/templates', adminTemplatesApp)
app.route('/admin/assets', adminAssetsApp)
app.route('/admin/convert', adminConvertApp)
app.route('/admin/clients', adminClientsApp)

export default app
