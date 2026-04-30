'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewShowPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', location: '', date: '', description: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/shows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/shows/${data.slug}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create show')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = 'w-full bg-ps-surface2 border border-ps-border rounded-xl px-4 py-2.5 text-ps-text text-sm focus:outline-none focus:border-ps-accent focus:ring-2 focus:ring-ps-accentLight transition-all'

  if (loading) return <div className="text-center py-20 text-ps-secondary">Loading…</div>
  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-ps-secondary mb-4">You must be signed in to create a show.</p>
        <Link href="/auth/login" className="text-ps-accent hover:text-ps-accentHover font-medium">Sign in →</Link>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Host a Show</h1>
        <p className="text-ps-secondary text-sm">Create your Pokemon card show page</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 mb-5 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-3xl border border-ps-borderLight shadow-card p-8 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-ps-text mb-1.5">
              Show Name <span className="text-ps-accent">*</span>
            </label>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Chicago Pokemon Card Expo"
              className={inputClass} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-ps-text mb-1.5">
              Location <span className="text-ps-accent">*</span>
            </label>
            <input type="text" value={form.location} onChange={(e) => set('location', e.target.value)}
              placeholder="e.g. Chicago, IL — McCormick Place"
              className={inputClass} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-ps-text mb-1.5">Date</label>
            <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ps-text mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
              rows={4} placeholder="Tell attendees what to expect…"
              className={inputClass + ' resize-none'} />
          </div>
          <p className="text-xs text-ps-muted">You can upload a flier and vendor map after creating the show.</p>
          <button type="submit" disabled={submitting}
            className="w-full bg-ps-accent hover:bg-ps-accentHover disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
            {submitting ? 'Creating…' : 'Create Show'}
          </button>
        </form>
      </div>
    </div>
  )
}
