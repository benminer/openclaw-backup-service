import path from 'node:path'
import { http } from '@ampt/sdk'
import express from 'express'
import morgan from 'morgan'
import { authMiddleware, sameOriginOrAuth } from '@/middleware/auth'
import { readRoutes, writeRoutes } from '@/routes/backup'
import { blogReadRoutes, blogWriteRoutes } from '@/routes/blog'

const app = express()

app.use(morgan('short'))

// SPA fallback handler
const spaFallback: express.RequestHandler = (_req, res, next) => {
  const indexPath = path.resolve('static/index.html')
  console.log('[SPA] serving:', indexPath, 'cwd:', process.cwd())
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('[SPA] sendFile failed:', err)
      next(err)
    }
  })
}

// Health check (no auth)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Read routes -- same-origin (frontend) or API key
app.use('/api', sameOriginOrAuth, readRoutes)
app.use('/api', sameOriginOrAuth, blogReadRoutes)

// Write routes -- always require API key
app.use('/api', authMiddleware, writeRoutes)
app.use('/api', authMiddleware, blogWriteRoutes)

// SPA fallback -- serve index.html for non-API routes so React Router works
// Using explicit route patterns since Express 5 changed wildcard handling
app.get('/blog', spaFallback)
app.get('/blog/{slug}', spaFallback)

http.node.use(app)
