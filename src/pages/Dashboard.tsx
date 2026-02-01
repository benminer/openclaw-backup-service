import { useCallback, useEffect, useRef, useState } from 'react'
import { BackupCard } from '../components/BackupCard'
import { StatsBar } from '../components/StatsBar'
import { UploadModal } from '../components/UploadModal'
import type { Backup } from '../lib/api'
import { fetchBackups } from '../lib/api'

export function Dashboard() {
  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setError(null)
      const data = await fetchBackups()
      // Sort by date descending
      data.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
      setBackups(data)
      setLastRefresh(new Date())
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : 'Failed to load backups')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    intervalRef.current = setInterval(() => load(true), 30000)
    return () => clearInterval(intervalRef.current)
  }, [load])

  const refresh = () => {
    setLoading(true)
    load()
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {!loading && backups.length > 0 && <StatsBar backups={backups} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-100">Backups</h2>
          <p className="text-sm text-gray-500 mt-1">
            Workspace snapshots · auto-refreshes every 30s
            <span className="text-gray-600 ml-2">
              last: {lastRefresh.toLocaleTimeString('en-US', { hour12: false })}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="p-2.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 disabled:opacity-50 transition-colors"
            title="Refresh"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 animate-fade-in">
          <p className="text-sm text-red-400 font-mono">{error}</p>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading backups...</p>
          </div>
        </div>
      ) : backups.length === 0 ? (
        <div className="text-center py-24 animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">No backups yet</p>
          <p className="text-sm text-gray-600 mt-1">Upload your first backup to get started</p>
        </div>
      ) : (
        <div className="grid gap-2.5">
          {backups.map((b) => (
            <BackupCard key={b.id} backup={b} onDeleted={refresh} />
          ))}
        </div>
      )}

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={refresh}
        />
      )}
    </div>
  )
}
