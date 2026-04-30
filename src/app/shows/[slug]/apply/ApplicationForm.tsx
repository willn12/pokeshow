'use client'
import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Calendar, ArrowLeft, CheckCircle2 } from 'lucide-react'

interface ShowInfo {
  slug: string
  name: string
  location: string
  date: string | null
}

interface UserInfo {
  id: string
  name: string
  businessName: string | null
  email: string
}

interface Props {
  show: ShowInfo
  user: UserInfo
}

const INVENTORY_OPTIONS = [
  { value: 'sealed', label: 'Sealed Product', icon: '📦', desc: 'Booster boxes, ETBs, packs' },
  { value: 'raw_singles', label: 'Raw Singles', icon: '🃏', desc: 'Ungraded individual cards' },
  { value: 'graded', label: 'Graded Cards', icon: '⭐', desc: 'PSA, CGC, BGS, SGC slabs' },
  { value: 'accessories', label: 'Accessories', icon: '🛍️', desc: 'Sleeves, binders, display cases' },
  { value: 'mixed', label: 'Mixed', icon: '🎴', desc: 'Combination of the above' },
  { value: 'other', label: 'Other', icon: '✨', desc: 'Something else' },
]

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ApplicationForm({ show, user }: Props) {
  const [inventoryType, setInventoryType] = useState('')
  const [estimatedValue, setEstimatedValue] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [applicationNote, setApplicationNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const inputClass =
    'w-full bg-ps-surface2 border border-ps-border rounded-xl px-4 py-2.5 text-ps-text text-sm focus:outline-none focus:border-ps-accent focus:ring-2 focus:ring-ps-accentLight transition-all placeholder:text-ps-muted'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/shows/${show.slug}/vendors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryType: inventoryType || null,
          estimatedValue: estimatedValue ? Number(estimatedValue) : null,
          instagramUrl: instagramUrl || null,
          websiteUrl: websiteUrl || null,
          applicationNote: applicationNote || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSubmitted(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-ps-text mb-2">Application Submitted!</h2>
        <p className="text-ps-secondary text-sm mb-6 leading-relaxed">
          The organizer will review your application and get back to you.
        </p>
        <Link
          href={`/shows/${show.slug}`}
          className="inline-flex items-center gap-2 bg-ps-accent hover:bg-ps-accentHover text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-colors"
        >
          Back to {show.name}
        </Link>
      </div>
    )
  }

  const avatarInitial = (user.businessName || user.name)[0].toUpperCase()

  return (
    <div className="max-w-xl mx-auto">
      <Link
        href={`/shows/${show.slug}`}
        className="inline-flex items-center gap-1.5 text-ps-secondary hover:text-ps-text text-sm mb-6 transition-colors font-medium"
      >
        <ArrowLeft size={14} /> Back to show
      </Link>

      {/* Show header */}
      <div className="bg-white border border-ps-borderLight rounded-3xl p-6 shadow-card mb-4">
        <div className="inline-flex items-center gap-1.5 bg-ps-accentLight text-ps-accent text-xs font-semibold px-3 py-1 rounded-full mb-3 tracking-wide uppercase">
          Vendor Application
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ps-text mb-3">{show.name}</h1>
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 text-sm text-ps-secondary bg-ps-surface2 border border-ps-borderLight px-3 py-1.5 rounded-full">
            <MapPin size={12} className="text-ps-accent" /> {show.location}
          </span>
          {show.date && (
            <span className="flex items-center gap-1.5 text-sm text-ps-secondary bg-ps-surface2 border border-ps-borderLight px-3 py-1.5 rounded-full">
              <Calendar size={12} className="text-ps-accent" /> {formatDateShort(show.date)}
            </span>
          )}
        </div>
      </div>

      {/* Your info (read-only) */}
      <div className="bg-white border border-ps-borderLight rounded-3xl p-6 shadow-card mb-4">
        <h2 className="text-sm font-semibold text-ps-text mb-4 uppercase tracking-wide text-xs text-ps-muted">Your Info</h2>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-ps-accentLight text-ps-accent font-bold text-base flex items-center justify-center shrink-0">
            {avatarInitial}
          </div>
          <div>
            <div className="font-semibold text-ps-text text-sm">
              {user.businessName ? (
                <>
                  {user.businessName}
                  <span className="font-normal text-ps-muted ml-1.5">({user.name})</span>
                </>
              ) : (
                user.name
              )}
            </div>
            <div className="text-xs text-ps-muted">{user.email}</div>
          </div>
        </div>
      </div>

      {/* Application form */}
      <form onSubmit={handleSubmit} className="bg-white border border-ps-borderLight rounded-3xl p-6 shadow-card space-y-6">
        <h2 className="font-semibold text-ps-text">Application Details</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {/* Inventory Type */}
        <div>
          <label className="block text-sm font-medium text-ps-text mb-3">
            Inventory Type <span className="text-ps-muted font-normal">(optional)</span>
          </label>
          <div className="space-y-2">
            {INVENTORY_OPTIONS.map((opt) => {
              const selected = inventoryType === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setInventoryType(selected ? '' : opt.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    selected
                      ? 'bg-ps-accentLight border-ps-accent ring-2 ring-ps-accentLight'
                      : 'bg-ps-surface2 border-ps-border hover:border-ps-accent hover:bg-white'
                  }`}
                >
                  <span className="text-lg shrink-0">{opt.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold ${selected ? 'text-ps-accent' : 'text-ps-text'}`}>
                      {opt.label}
                    </div>
                    <div className="text-xs text-ps-muted">{opt.desc}</div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 transition-all ${
                    selected ? 'border-ps-accent bg-ps-accent' : 'border-ps-border bg-white'
                  }`}>
                    {selected && (
                      <div className="w-full h-full rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Estimated Value */}
        <div>
          <label className="block text-sm font-medium text-ps-text mb-1.5">
            Estimated Inventory Value <span className="text-ps-muted font-normal">(optional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ps-muted text-sm font-medium">$</span>
            <input
              type="number"
              min="0"
              step="1"
              value={estimatedValue}
              onChange={(e) => setEstimatedValue(e.target.value)}
              placeholder="0"
              className={inputClass + ' pl-7'}
            />
          </div>
        </div>

        {/* Instagram */}
        <div>
          <label className="block text-sm font-medium text-ps-text mb-1.5">
            Instagram <span className="text-ps-muted font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            placeholder="@yourhandle or full URL"
            className={inputClass}
          />
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-ps-text mb-1.5">
            Website <span className="text-ps-muted font-normal">(optional)</span>
          </label>
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://yoursite.com"
            className={inputClass}
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-ps-text mb-1.5">
            Message to organizer <span className="text-ps-muted font-normal">(optional)</span>
          </label>
          <textarea
            rows={4}
            value={applicationNote}
            onChange={(e) => setApplicationNote(e.target.value)}
            placeholder="Tell the organizer about your inventory, experience, or anything else…"
            className={inputClass + ' resize-none'}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-ps-accent hover:bg-ps-accentHover disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          {submitting ? 'Submitting…' : 'Submit Application'}
        </button>
      </form>
    </div>
  )
}
