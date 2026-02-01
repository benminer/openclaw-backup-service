import path from 'node:path'
import { http } from '@ampt/sdk'
import express from 'express'
import morgan from 'morgan'
import { authMiddleware, sameOriginOrAuth } from '@/middleware/auth'
import { readRoutes, writeRoutes } from '@/routes/backup'
import { blogReadRoutes, blogWriteRoutes } from '@/routes/blog'

const app = express()

app.use(morgan('short'))

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
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) return next()
  // Skip requests for actual static files (js, css, images, etc.)
  if (req.path.match(/\.\w+$/)) return next()
  res.sendFile(path.resolve('static/index.html'))
})

http.node.use(app)
