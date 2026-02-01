import type { Backup } from '../lib/api'
import { formatBytes, timeAgo } from '../lib/format'

interface Props {
  backups: Backup[]
}

export function StatsBar({ backups }: Props) {
  const totalSize = backups.reduce((sum, b) => sum + (b.size || 0), 0)
  const labels = new Set(backups.map((b) => b.label))
  const latest = backups.length
    ? backups.reduce((a, b) =>
        new Date(a.lastModified) > new Date(b.lastModified) ? a : b
      )
    : null

  const stats = [
    { label: 'Total Backups', value: String(backups.length), accent: 'text-violet-400' },
    { label: 'Labels', value: String(labels.size), accent: 'text-blue-400' },
    { label: 'Total Size', value: formatBytes(totalSize), accent: 'text-cyan-400' },
    { label: 'Latest', value: latest ? timeAgo(latest.lastModified) : '—', accent: 'text-emerald-400' }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-gray-900/80 border border-gray-800/60 rounded-xl px-4 py-3.5"
        >
          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">
            {s.label}
          </p>
          <p className={`text-xl font-semibold font-mono ${s.accent}`}>
            {s.value}
          </p>
        </div>
      ))}
    </div>
  )
}
