'use client'
import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'

interface Props {
  label: string
  currentUrl?: string | null
  onUpload: (url: string) => void
}

export default function ImageUpload({ label, currentUrl, onUpload }: Props) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPreview(data.url)
      onUpload(data.url)
    } finally {
      setUploading(false)
    }
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

  return (
    <div>
      <label className="block text-sm font-medium text-ps-text mb-2">{label}</label>
      {preview ? (
        <div className="relative">
          <img src={preview} alt={label} className="w-full max-h-56 object-cover rounded-2xl border border-ps-borderLight" />
          <button
            onClick={() => { setPreview(null); onUpload('') }}
            className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-soft text-ps-secondary hover:text-ps-text transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-ps-border hover:border-ps-accent rounded-2xl p-8 text-center cursor-pointer transition-colors bg-ps-surface2 hover:bg-ps-accentLight"
        >
          {uploading ? (
            <p className="text-sm text-ps-secondary">Uploading…</p>
          ) : (
            <>
              <Upload size={22} className="mx-auto mb-2 text-ps-muted" />
              <p className="text-sm text-ps-secondary">Drop image here or <span className="text-ps-accent font-medium">browse</span></p>
              <p className="text-xs text-ps-muted mt-1">JPG, PNG, GIF, WebP</p>
            </>
          )}
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </div>
  )
}
