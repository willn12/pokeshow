'use client'
import { useState, useRef } from 'react'
import { X, Play, Film } from 'lucide-react'

interface Props {
  label?: string
  currentUrl?: string | null
  onUpload: (url: string) => void
}

const ACCEPTED = 'video/mp4,video/webm,video/quicktime,video/x-msvideo,video/mpeg'


export default function VideoUpload({ label, currentUrl, onUpload }: Props) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [url, setUrl] = useState<string | null>(currentUrl ?? null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    setError('')

    if (file.size > 200 * 1024 * 1024) {
      setError('Video must be under 200 MB')
      return
    }

    setUploading(true)
    setProgress(0)

    const formData = new FormData()
    formData.append('file', file)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/upload')

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
    })

    xhr.addEventListener('load', () => {
      setUploading(false)
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText) as { url: string }
        setUrl(data.url)
        onUpload(data.url)
      } else {
        try {
          const err = JSON.parse(xhr.responseText) as { error?: string }
          setError(err.error ?? 'Upload failed')
        } catch {
          setError('Upload failed')
        }
      }
    })

    xhr.addEventListener('error', () => {
      setUploading(false)
      setError('Network error — please try again')
    })

    xhr.send(formData)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function remove() {
    setUrl(null)
    setError('')
    setProgress(0)
    onUpload('')
    if (inputRef.current) inputRef.current.value = ''
  }

  if (url) {
    return (
      <div>
        {label && <p className="text-sm font-medium text-ps-text mb-2">{label}</p>}
        <div className="relative rounded-2xl overflow-hidden flex justify-center bg-gray-950">
          <video
            src={url}
            controls
            className="block max-w-full max-h-72"
            preload="metadata"
          />
          <button
            type="button"
            onClick={remove}
            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 rounded-full p-1.5 text-white transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {label && <p className="text-sm font-medium text-ps-text mb-2">{label}</p>}

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
          uploading
            ? 'border-ps-accent bg-ps-accentLight cursor-wait'
            : 'border-ps-border hover:border-ps-accent bg-ps-surface2 hover:bg-ps-accentLight cursor-pointer'
        }`}
      >
        {uploading ? (
          <div className="space-y-3">
            <Film size={24} className="mx-auto text-ps-accent animate-pulse" />
            <p className="text-sm font-semibold text-ps-accent">Uploading… {progress}%</p>
            <div className="mx-auto max-w-[200px] h-2 bg-ps-border rounded-full overflow-hidden">
              <div
                className="h-full bg-ps-accent rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-ps-accentLight border border-ps-borderLight flex items-center justify-center">
              <Play size={20} className="text-ps-accent" />
            </div>
            <p className="text-sm text-ps-secondary font-medium">
              Drop video here or <span className="text-ps-accent font-semibold">browse</span>
            </p>
            <p className="text-xs text-ps-muted mt-1.5">MP4, WebM, MOV · Max 200 MB</p>
          </>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
          <X size={11} /> {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}
