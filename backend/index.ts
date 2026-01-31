import { http } from '@ampt/sdk'
import express from 'express'
import morgan from 'morgan'
import { authMiddleware } from '@/middleware/auth'
import backupRoutes from '@/routes/backup'

const app = express()

app.use(morgan('short'))

// Health check (no auth)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Auth for all other /api routes
app.use('/api', authMiddleware)
app.use('/api', backupRoutes)

http.node.use(app)
