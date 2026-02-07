import { data } from '@ampt/data'
import express, { Router } from 'express'

export interface CronJob {
  id: string
  name: string
  schedule: object
  enabled: boolean
  nextRunAtMs?: number
  lastRunAtMs?: number
}

const PREFIX = 'cron'
const ID_RE = /^[a-zA-Z0-9_-]+$/

function validId(id: string): boolean {
  return typeof id === 'string' && id.length >= 1 && id.length <= 64 && ID_RE.test(id)
}

export const cronReadRoutes = Router()

cronReadRoutes.get('/cron/jobs', async (req, res) => {
  try {
    const limitStr = (req.query.limit as string) || '100'
    const limit = Math.min(Number.parseInt(limitStr, 10), 200)
    const result = await data.get(`${PREFIX}:*`, { limit: 500 })
    const jobs: CronJob[] = (result.items || []).map((item: any) => item.value)
    jobs.sort((a: CronJob, b: CronJob) => {
      const na = a.nextRunAtMs ?? Infinity
      const nb = b.nextRunAtMs ?? Infinity
      return na < nb ? -1 : na > nb ? 1 : a.name.localeCompare(b.name)
    })
    res.json({ jobs: jobs.slice(0, limit) })
  } catch (err) {
    console.error('Failed to list cron jobs:', err)
    res.status(500).json({ error: 'Failed to list jobs' })
  }
})

export const cronWriteRoutes = Router()
cronWriteRoutes.use(express.json())

cronWriteRoutes.post('/cron/jobs', async (req, res) => {
  try {
    const { jobs }: { jobs: CronJob[] } = req.body
    if (!Array.isArray(jobs) || jobs.length === 0) {
      res.status(400).json({ error: 'jobs array required' })
      return
    }
    let newCount = 0
    let updatedCount = 0
    let skipCount = 0
    for (const job of jobs) {
      if (!job.id || !job.name || typeof job.enabled !== 'boolean') {
        skipCount++
        continue
      }
      if (!validId(job.id)) {
        skipCount++
        continue
      }
      const key = `${PREFIX}:${job.id}`
      const existing = await data.get(key)
      if (existing) {
        updatedCount++
      } else {
        newCount++
      }
      await data.set(key, job)
    }
    res.json({ new: newCount, updated: updatedCount, skipped: skipCount })
  } catch (err) {
    console.error('Failed to sync cron jobs:', err)
    res.status(500).json({ error: 'Failed to sync jobs' })
  }
})
