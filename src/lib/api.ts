export interface Backup {
  id: string
  key: string
  label: string
  size: number
  lastModified: string
  metadata?: {
    label?: string
    createdAt?: string
    fileCount?: string
    totalSize?: string
  }
}

export interface BackupsResponse {
  backups: Backup[]
}

export interface RestoreResponse {
  id: string
  key: string
  downloadUrl: string
  size: number
}

const getApiKey = (): string | null => localStorage.getItem('backup-api-key')

const authHeaders = (): HeadersInit => {
  const key = getApiKey()
  return key ? { Authorization: `Bearer ${key}` } : {}
}

export const fetchBackups = async (): Promise<Backup[]> => {
  const res = await fetch('/api/backups')
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`)
  const data: BackupsResponse = await res.json()
  return data.backups
}

export const getDownloadUrl = async (label: string, timestamp: string): Promise<string> => {
  const res = await fetch(`/api/restore/${label}/${timestamp}`)
  if (!res.ok) throw new Error(`Failed to get download URL: ${res.status}`)
  const data: RestoreResponse = await res.json()
  return data.downloadUrl
}

export const deleteBackup = async (label: string, timestamp: string): Promise<void> => {
  const res = await fetch(`/api/backup/${label}/${timestamp}`, {
    method: 'DELETE',
    headers: authHeaders()
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Delete failed: ${res.status}`)
  }
}

export const requestUploadUrl = async (
  label: string,
  fileCount?: number,
  totalSize?: number
): Promise<{ uploadUrl: string; id: string }> => {
  const params = new URLSearchParams({ label })
  if (fileCount) params.set('fileCount', String(fileCount))
  if (totalSize) params.set('totalSize', String(totalSize))

  const res = await fetch(`/api/backup?${params}`, {
    method: 'POST',
    headers: authHeaders()
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Upload request failed: ${res.status}`)
  }
  return res.json()
}

export const uploadFile = async (uploadUrl: string, file: File): Promise<void> => {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/gzip' },
    body: file
  })
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
}
