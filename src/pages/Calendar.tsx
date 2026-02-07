import { useCallback, useEffect, useMemo, useState } from 'react'

interface CronJob {
  id: string
  name: string
  schedule: object
  enabled: boolean
  nextRunAtMs?: number
  lastRunAtMs?: number
}

function relativeTimeAgo(pastMs: number): string {
  const diffMs = Date.now() - pastMs
  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

function nextRunText(nextMs?: number): string {
  if (!nextMs) return 'Never'
  const nowMs = Date.now()
  const diffMs = nextMs - nowMs
  if (diffMs < 0) return 'Overdue'
  const diffSeconds = Math.floor(diffMs / 1000)
  if (diffSeconds < 60) return 'Now'
  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `in ${diffMinutes}m`
  const diffHours = Math.floor(diffSeconds / 3600)
  if (diffHours < 24) return `in ${diffHours}h`
  const date = new Date(nextMs)
  const tomorrow = new Date(nowMs + 24 * 3600 * 1000)
  if (date.toDateString() === tomorrow.toDateString()) {
    const hour12 = date.getHours() % 12 || 12
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM'
    const mins = date.getMinutes().toString().padStart(2, '0')
    return `tomorrow at ${hour12}:${mins}${ampm}`
  }
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

export function Calendar() {
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)
  const [filterEnabled, setFilterEnabled] = useState<'all' | 'enabled' | 'disabled'>('all')
  const [sortBy, setSortBy] = useState<'next' | 'name'>('next')

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cron/jobs?limit=200')
      const data = await res.json()
      setJobs(data.jobs || [])
    } catch (err) {
      console.error('Failed to fetch cron jobs:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs()
    const interval = setInterval(fetchJobs, 30000) // 30s
    return () => clearInterval(interval)
  }, [fetchJobs])

  const filteredSortedJobs = useMemo(() => {
    const filtered = jobs.filter(
      (job) =>
        filterEnabled === 'all' ||
        (filterEnabled === 'enabled' && job.enabled) ||
        (filterEnabled === 'disabled' && !job.enabled)
    )
    if (sortBy === 'next') {
      filtered.sort((a, b) => {
        const na = a.nextRunAtMs ?? Infinity
        const nb = b.nextRunAtMs ?? Infinity
        return na < nb ? -1 : na > nb ? 1 : a.name.localeCompare(b.name)
      })
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name))
    }
    return filtered
  }, [jobs, filterEnabled, sortBy])

  return (
    <div className="animate-fade-in relative">
      {/* Scanline overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] opacity-[0.03]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.1) 2px, rgba(0,255,255,0.1) 4px)'
        }}
      />

      {/* Header */}
      <div className="mb-10 relative z-[2]">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Scheduled Tasks
        </h1>
        <p className="mt-2 text-gray-500 font-mono text-sm">{/* cron job calendar */}</p>
        <div className="mt-6 flex flex-wrap gap-4 items-center text-sm">
          <span className="font-mono text-gray-400">Filter:</span>
          <select
            value={filterEnabled}
            onChange={(e) => setFilterEnabled(e.target.value as any)}
            className="bg-gray-900/50 border border-gray-700/50 hover:border-cyan-500/50 focus:border-cyan-400 rounded-lg px-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-colors"
            aria-label="Filter jobs"
          >
            <option value="all">All Jobs</option>
            <option value="enabled">Enabled Only</option>
            <option value="disabled">Disabled Only</option>
          </select>
          <span className="font-mono text-gray-400 ml-6">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-gray-900/50 border border-gray-700/50 hover:border-cyan-500/50 focus:border-cyan-400 rounded-lg px-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-colors"
            aria-label="Sort jobs"
          >
            <option value="next">Next Run</option>
            <option value="name">Name</option>
          </select>
          <div className="flex-1" />
          <button
            type="button"
            onClick={fetchJobs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 border border-gray-700/50 hover:border-cyan-500/50 hover:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 rounded-lg font-mono text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              'Refresh'
            )}
          </button>
        </div>
        <div className="mt-8 h-px bg-gradient-to-r from-violet-500/50 via-cyan-500/50 to-emerald-500/50" />
      </div>

      <div className="relative z-[2]">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 glow-pulse" />
            <span className="ml-4 text-gray-500 font-mono text-lg">loading cron jobs...</span>
          </div>
        ) : filteredSortedJobs.length === 0 ? (
          <div className="text-center py-32">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="No scheduled jobs"
            >
              <title>No scheduled jobs</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-gray-500 font-mono text-lg">No scheduled jobs</p>
            <p className="text-gray-600 font-mono text-sm mt-2">All channels quiet for now</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSortedJobs.map((job) => (
              <div
                key={job.id}
                className="group p-6 rounded-2xl border border-gray-800/50 hover:border-cyan-500/50 bg-gray-900/20 backdrop-blur-sm hover:shadow-2xl hover:shadow-cyan-500/20 hover:bg-gray-900/40 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 shadow-lg transition-all ${
                      job.enabled
                        ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 shadow-emerald-400/50 animate-pulse-slow'
                        : 'bg-gray-600 shadow-gray-500/50'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-bold text-xl leading-tight text-gray-100 group-hover:text-cyan-400 transition-colors truncate pr-4">
                        {job.name}
                      </h3>
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase shadow-sm transition-all ${
                          job.enabled
                            ? 'bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 shadow-emerald-500/50 hover:shadow-emerald-500/75'
                            : 'bg-red-500/20 border-2 border-red-500/40 text-red-400 shadow-red-500/50 hover:shadow-red-500/75'
                        }`}
                      >
                        {job.enabled ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </div>
                    <div className="text-2xl font-mono font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-4 leading-tight">
                      {nextRunText(job.nextRunAtMs)}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
                      <div className="space-y-1">
                        <span className="text-gray-500 font-mono block">Schedule:</span>
                        <div className="font-mono text-gray-300 bg-black/30 px-3 py-1.5 rounded-lg text-xs border border-gray-700/50 backdrop-blur-sm truncate max-w-full">
                          {JSON.stringify(job.schedule)}
                        </div>
                      </div>
                      {job.lastRunAtMs && (
                        <div>
                          <span className="text-gray-500 font-mono">Last run:</span>
                          <span className="ml-2 text-gray-400 font-mono text-sm">
                            {relativeTimeAgo(job.lastRunAtMs)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
