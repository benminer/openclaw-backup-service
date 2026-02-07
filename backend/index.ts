import { http } from '@ampt/sdk'
import express from 'express'
import morgan from 'morgan'
import { authMiddleware, sameOriginOrAuth } from '@/middleware/auth'
import { activityReadRoutes, activityWriteRoutes } from '@/routes/activity'
import { readRoutes, writeRoutes } from '@/routes/backup'
import { blogReadRoutes, blogWriteRoutes } from '@/routes/blog'
import { cronReadRoutes, cronWriteRoutes } from '@/routes/cron'

const app = express()

app.use(morgan('short'))

// Health check (no auth)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Read routes -- same-origin (frontend) or API key
app.use('/api', sameOriginOrAuth, readRoutes)
app.use('/api', sameOriginOrAuth, blogReadRoutes)
app.use('/api', sameOriginOrAuth, activityReadRoutes)
app.use('/api', sameOriginOrAuth, cronReadRoutes)

// Write routes -- always require API key
app.use('/api', authMiddleware, writeRoutes)
app.use('/api', authMiddleware, blogWriteRoutes)
app.use('/api', authMiddleware, activityWriteRoutes)
app.use('/api', authMiddleware, cronWriteRoutes)

// SPA fallback -- serve index.html for non-API routes so React Router works
// Uses Ampt's readStaticFile since static assets aren't on disk in the usual way
app.use(async (req, res) => {
  res.status(200).set('Content-Type', 'text/html')
  const stream = await http.node.readStaticFile('index.html')
  return stream.pipe(res)
})

http.node.use(app)
