import { useEffect, useState } from 'react'

interface ActivityEvent {
  id: string
  ts: string
  type: string
  detail: string
}

const typeColors: Record<string, { dot: string; badge: string }> = {
  deploy: { dot: 'bg-cyan-400 shadow-cyan-400/50', badge: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10' },
  'blog-post': {
    dot: 'bg-violet-400 shadow-violet-400/50',
    badge: 'text-violet-400 border-violet-400/30 bg-violet-400/10'
  },
  'code-review': {
    dot: 'bg-green-400 shadow-green-400/50',
    badge: 'text-green-400 border-green-400/30 bg-green-400/10'
  },
  fix: { dot: 'bg-yellow-400 shadow-yellow-400/50', badge: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' },
  moltbook: {
    dot: 'bg-fuchsia-400 shadow-fuchsia-400/50',
    badge: 'text-fuchsia-400 border-fuchsia-400/30 bg-fuchsia-400/10'
  },
  linear: {
    dot: 'bg-orange-400 shadow-orange-400/50',
    badge: 'text-orange-400 border-orange-400/30 bg-orange-400/10'
  }
}

const defaultColor = {
  dot: 'bg-gray-400 shadow-gray-400/50',
  badge: 'text-gray-400 border-gray-400/30 bg-gray-400/10'
}

function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export function Activity() {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = () => {
      fetch('/api/activity/events?limit=100')
        .then((r) => r.json())
        .then((d) => setEvents(d.events || []))
        .catch(console.error)
        .finally(() => setLoading(false))
    }
    fetchEvents()
    const interval = setInterval(fetchEvents, 60000)
    return () => clearInterval(interval)
  }, [])

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
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
          Activity Feed
        </h1>
        <p className="mt-2 text-gray-500 font-mono text-sm">{'// system event log'}</p>
        <div className="mt-4 h-px bg-gradient-to-r from-cyan-500/50 via-violet-500/50 to-transparent" />
      </div>

      <div className="relative z-[2]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-3 h-3 rounded-full bg-cyan-500 glow-pulse" />
            <span className="ml-3 text-gray-500 font-mono text-sm">loading events...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 font-mono text-sm">{'>'} no events recorded</p>
            <p className="text-gray-700 font-mono text-xs mt-1">silence on all channels</p>
          </div>
        ) : (
          <div className="space-y-1">
            {events.map((event) => {
              const colors = typeColors[event.type] || defaultColor
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 px-4 py-3 rounded-lg hover:bg-gray-900/50 transition-colors group"
                >
                  {/* Neon dot */}
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 shadow-sm ${colors.dot}`} />

                  {/* Timestamp */}
                  <span
                    className="text-xs text-gray-500 font-mono w-16 shrink-0 mt-0.5"
                    title={new Date(event.ts).toLocaleString()}
                  >
                    {relativeTime(event.ts)}
                  </span>

                  {/* Type badge */}
                  <span
                    className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border shrink-0 mt-0.5 ${colors.badge}`}
                  >
                    {event.type}
                  </span>

                  {/* Detail */}
                  <span className="text-sm text-gray-300 leading-relaxed">{event.detail}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
