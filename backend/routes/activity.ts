import { data } from '@ampt/data'
import express, { Router } from 'express'

export interface ActivityEvent {
  id: string
  ts: string
  type: string
  detail: string
}

const PREFIX = 'activity'
const ID_RE = /^[a-zA-Z0-9_-]+$/

function validId(id: string): boolean {
  return typeof id === 'string' && id.length >= 1 && id.length <= 64 && ID_RE.test(id)
}

// Read routes (sameOriginOrAuth)
export const activityReadRoutes = Router()

activityReadRoutes.get('/activity/events', async (req, res) => {
  try {
    const limit = Math.min(Number.parseInt(req.query.limit as string, 10) || 50, 200)
    const type = req.query.type as string | undefined
    const before = req.query.before as string | undefined

    // Query by label1 (type) if filtered, otherwise get all by prefix
    let items: ActivityEvent[] = []

    if (type) {
      const result = await data.getByLabel('label1', `${PREFIX}-type:${type}`, { limit })
      items = (result.items || []).map((item: { value: ActivityEvent }) => item.value)
    } else {
      const result = await data.get(`${PREFIX}:*`, { limit })
      items = (result.items || []).map((item: { value: ActivityEvent }) => item.value)
    }

    // Filter by before timestamp if provided
    if (before) {
      const beforeTs = new Date(before).getTime()
      items = items.filter((e) => new Date(e.ts).getTime() < beforeTs)
    }

    // Sort by timestamp desc
    items.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())

    res.json({ events: items.slice(0, limit) })
  } catch (err) {
    console.error('Failed to list activity events:', err)
    res.status(500).json({ error: 'Failed to list events' })
  }
})

// Write routes (authMiddleware)
export const activityWriteRoutes = Router()
activityWriteRoutes.use(express.json())

activityWriteRoutes.post('/activity/events', async (req, res) => {
  try {
    const { events } = req.body as { events: ActivityEvent[] }
    if (!Array.isArray(events) || events.length === 0) {
      res.status(400).json({ error: 'events array required' })
      return
    }

    let newCount = 0
    let dupCount = 0

    for (const event of events) {
      if (!event.id || !event.ts || !event.type || !event.detail) {
        continue
      }
      if (!validId(event.id)) {
        continue
      }

      // Dedup: check if event already exists
      const existing = await data.get(`${PREFIX}:${event.id}`)
      if (existing) {
        dupCount++
        continue
      }

      // Store with label1 for type-based queries
      await data.set(`${PREFIX}:${event.id}`, { ...event }, { label1: `${PREFIX}-type:${event.type}` })
      newCount++
    }

    res.json({ new: newCount, duplicates: dupCount })
  } catch (err) {
    console.error('Failed to write activity events:', err)
    res.status(500).json({ error: 'Failed to write events' })
  }
})
