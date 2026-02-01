import { useRef, useState } from 'react'
import { requestUploadUrl, uploadFile } from '../lib/api'

interface Props {
  onClose: () => void
  onUploaded: () => void
}

export function UploadModal({ onClose, onUploaded }: Props) {
  const [label, setLabel] = useState('default')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError(null)

    try {
      setProgress('Requesting upload URL...')
      const { uploadUrl } = await requestUploadUrl(label, undefined, file.size)

      setProgress('Uploading...')
      await uploadFile(uploadUrl, file)

      setProgress('Done!')
      onUploaded()
      setTimeout(onClose, 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-gray-900 border border-gray-700/50 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-lg font-semibold text-gray-100 mb-1">Upload Backup</h2>
        <p className="text-sm text-gray-500 mb-5">
          Upload a .tar.gz backup archive to storage.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 font-mono placeholder:text-gray-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Archive File
            </label>
            <input
              ref={inputRef}
              type="file"
              accept=".tar.gz,.tgz"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-700 rounded-lg px-4 py-6 text-center hover:border-violet-500/40 transition-colors"
            >
              {file ? (
                <span className="text-sm text-violet-300 font-mono">{file.name}</span>
              ) : (
                <span className="text-sm text-gray-500">Click to select .tar.gz file</span>
              )}
            </button>
          </div>
        </div>

        {progress && !error && (
          <p className="mt-4 text-sm text-violet-400 font-mono">{progress}</p>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-400 font-mono">{error}</p>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || !label.trim() || uploading}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  )
}
