import { useEffect, useState } from 'react'

interface Props {
  onClose: () => void
}

export function SettingsModal({ onClose }: Props) {
  const [apiKey, setApiKey] = useState('')

  useEffect(() => {
    setApiKey(localStorage.getItem('backup-api-key') || '')
  }, [])

  const save = () => {
    if (apiKey.trim()) {
      localStorage.setItem('backup-api-key', apiKey.trim())
    } else {
      localStorage.removeItem('backup-api-key')
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-gray-900 border border-gray-700/50 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-lg font-semibold text-gray-100 mb-1">Settings</h2>
        <p className="text-sm text-gray-500 mb-5">
          API key is required for write operations (delete, upload).
        </p>

        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your API key..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 font-mono placeholder:text-gray-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-colors"
        />

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
