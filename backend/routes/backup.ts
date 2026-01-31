import { storage } from '@ampt/sdk'
import { Router } from 'express'

const router = Router()
const backups = storage('backups')

// POST /api/backup - get a presigned upload URL
router.post('/backup', async (req, res) => {
  const label = (req.query.label as string) || 'default'
  const fileCount = req.query.fileCount ? Number(req.query.fileCount) : 0
  const totalSize = req.query.totalSize ? Number(req.query.totalSize) : 0
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

  res.json({ id: `${label}/${timestamp}`, key, uploadUrl })
})

// GET /api/backups - list available backups
router.get('/backups', async (req, res) => {
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

// GET /api/restore/:label/:timestamp - get presigned download URL
router.get('/restore/:label/:timestamp', async (req, res) => {
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

// DELETE /api/backup/:label/:timestamp - delete a backup
router.delete('/backup/:label/:timestamp', async (req, res) => {
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

export default router
