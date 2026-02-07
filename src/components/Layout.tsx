import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { SettingsModal } from './SettingsModal'

function NavLink({ to, label, shortLabel }: { to: string; label: string; shortLabel?: string }) {
  const location = useLocation()
  const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
  return (
    <Link
      to={to}
      className={`px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-sm font-mono transition-colors ${
        active ? 'text-cyan-400 bg-cyan-500/10' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
      }`}
    >
      <span className="sm:hidden">{shortLabel || label}</span>
      <span className="hidden sm:inline">{label}</span>
    </Link>
  )
}

export function Layout() {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="border-b border-gray-800/60 bg-gray-950/90 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-violet-500 glow-pulse" />
              <h1 className="text-base sm:text-lg font-semibold tracking-tight text-gray-100">
                <span className="sm:hidden">Eva</span>
                <span className="hidden sm:inline">OpenClaw Agent Dashboard</span>
              </h1>
            </Link>
            <div className="flex items-center gap-1">
              <nav className="flex items-center gap-0.5 sm:gap-1">
                <NavLink to="/" label="Dashboard" shortLabel="Home" />
                <NavLink to="/activity" label="Activity" shortLabel="Feed" />
                <NavLink to="/calendar" label="Calendar" shortLabel="Cal" />
                <NavLink to="/blog" label="Blog" />
              </nav>
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 transition-colors shrink-0"
                title="Settings"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  role="img"
                  aria-label="Settings"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="border-t border-gray-800/40 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <p className="text-[11px] text-gray-600 font-mono">openclaw-agent-dashboard v1.0.0</p>
          <div className="flex items-center gap-2 text-[11px] text-gray-600 font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Connected
          </div>
        </div>
      </footer>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}
