import { storage } from '@ampt/sdk'
import { Router } from 'express'

const backups = storage('backups')

// Read routes -- accessible via same-origin or API key
export const readRoutes = Router()

readRoutes.get('/backups', async (req, res) => {
  const label = (req.query.label as string) || undefined
  const prefix = label ? `/${label}` : '/'

  const pages = await backups.list(prefix, { recursive: true })
  const results = []

  for await (const items of pages) {
    for (const item of items) {
      if (!item.endsWith('.tar.gz')) continue
      const stat = await backups.stat(item)
      if (!stat) continue

      const parts = item
        .replace(/^\//, '')
        .replace(/\.tar\.gz$/, '')
        .split('/')
      results.push({
        id: parts.join('/'),
        key: item,
        label: parts[0],
        size: stat.size,
        lastModified: stat.lastModified,
        metadata: stat.metadata
      })
    }
  }

  res.json({ backups: results })
})

readRoutes.get('/stats', async (req, res) => {
  const pages = await backups.list('/', { recursive: true })
  let totalBackups = 0
  let totalSize = 0
  let latestBackup: string | null = null
  let latestDate: Date | null = null
  const labels = new Set<string>()

  for await (const page of pages) {
    for (const item of page) {
      if (!item.endsWith('.tar.gz')) continue
      const stat = await backups.stat(item)
      if (!stat) continue

      totalBackups++
      totalSize += stat.size || 0
      labels.add(item.replace(/^\//, '').split('/')[0])

      const modified = new Date(stat.lastModified)
      if (!latestDate || modified > latestDate) {
        latestDate = modified
        latestBackup = item
      }
    }
  }

  res.json({
    totalBackups,
    totalSize,
    totalSizeHuman: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
    labels: [...labels],
    latestBackup,
    latestDate: latestDate?.toISOString() || null
  })
})

readRoutes.get('/restore/:label/:timestamp', async (req, res) => {
  const { label, timestamp } = req.params
  const key = `/${label}/${timestamp}.tar.gz`

  const stat = await backups.stat(key)
  if (!stat) {
    res.status(404).json({ error: 'Backup not found' })
    return
  }

  const downloadUrl = await backups.getDownloadUrl(key)
  res.json({ id: `${label}/${timestamp}`, key, downloadUrl, size: stat.size, metadata: stat.metadata })
})

// Write routes -- always require API key
export const writeRoutes = Router()

const DEFAULT_MAX_BACKUPS = 10

const pruneOldBackups = async (label: string, maxKeep: number) => {
  const prefix = `/${label}`
  const pages = await backups.list(prefix, { recursive: true })
  const items: { key: string; lastModified: Date }[] = []

  for await (const page of pages) {
    for (const item of page) {
      if (!item.endsWith('.tar.gz')) continue
      const stat = await backups.stat(item)
      if (stat) items.push({ key: item, lastModified: new Date(stat.lastModified) })
    }
  }

  items.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())

  const toDelete = items.slice(maxKeep)
  for (const item of toDelete) {
    await backups.remove(item.key)
  }

  return toDelete.length
}

writeRoutes.post('/backup', async (req, res) => {
  const label = (req.query.label as string) || 'default'
  const fileCount = req.query.fileCount ? Number(req.query.fileCount) : 0
  const totalSize = req.query.totalSize ? Number(req.query.totalSize) : 0
  const maxKeep = req.query.maxKeep ? Number(req.query.maxKeep) : DEFAULT_MAX_BACKUPS
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const key = `/${label}/${timestamp}.tar.gz`

  const uploadUrl = await backups.getUploadUrl(key, {
    metadata: {
      label,
      createdAt: new Date().toISOString(),
      fileCount: String(fileCount),
      totalSize: String(totalSize)
    },
    type: 'application/gzip'
  })

  // Auto-prune old backups after creating a new one
  const pruned = await pruneOldBackups(label, maxKeep)

  res.json({ id: `${label}/${timestamp}`, key, uploadUrl, pruned })
})

writeRoutes.post('/backup/prune', async (req, res) => {
  const label = (req.query.label as string) || 'default'
  const maxKeep = req.query.maxKeep ? Number(req.query.maxKeep) : DEFAULT_MAX_BACKUPS
  const pruned = await pruneOldBackups(label, maxKeep)
  res.json({ pruned, label, maxKeep })
})

writeRoutes.delete('/backup/:label/:timestamp', async (req, res) => {
  const { label, timestamp } = req.params
  const key = `/${label}/${timestamp}.tar.gz`

  const stat = await backups.stat(key)
  if (!stat) {
    res.status(404).json({ error: 'Backup not found' })
    return
  }

  await backups.remove(key)
  res.json({ deleted: true, id: `${label}/${timestamp}` })
})
