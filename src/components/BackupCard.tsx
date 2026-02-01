import { useState } from 'react'
import type { Backup } from '../lib/api'
import { deleteBackup, getDownloadUrl } from '../lib/api'
import { formatBytes, formatDate, timeAgo } from '../lib/format'

interface Props {
  backup: Backup
  onDeleted: () => void
}

const extractTimestamp = (backup: Backup): string => {
  const parts = backup.id.split('/')
  return parts[parts.length - 1]
}

export function BackupCard({ backup, onDeleted }: Props) {
  const [deleting, setDeleting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const timestamp = extractTimestamp(backup)
  const fileCount = backup.metadata?.fileCount

  const handleDownload = async () => {
    setDownloading(true)
    setError(null)
    try {
      const url = await getDownloadUrl(backup.label, timestamp)
      window.open(url, '_blank')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setDownloading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    setDeleting(true)
    setError(null)
    try {
      await deleteBackup(backup.label, timestamp)
      onDeleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="group bg-gray-900/80 border border-gray-800/60 rounded-xl p-5 hover:border-violet-500/30 hover:bg-gray-900 transition-all duration-200 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-violet-500/15 text-violet-300 border border-violet-500/20">
              {backup.label}
            </span>
            {fileCount && (
              <span className="text-xs text-gray-500 font-mono">
                {fileCount} files
              </span>
            )}
          </div>
          <p className="text-sm font-mono text-gray-400">
            {formatDate(backup.lastModified)}
          </p>
          <p className="text-xs text-gray-600 mt-0.5">
            {timeAgo(backup.lastModified)}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-mono text-cyan-400/80 bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/10">
            {formatBytes(backup.size)}
          </span>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="p-2 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 disabled:opacity-50 transition-colors"
            title="Download"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
              confirmDelete
                ? 'text-red-400 bg-red-500/20 hover:bg-red-500/30'
                : 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
            }`}
            title={confirmDelete ? 'Click again to confirm' : 'Delete'}
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-400 font-mono">{error}</p>
      )}
    </div>
  )
}
