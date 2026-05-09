'use client'
import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Calendar, ArrowLeft, CheckCircle2, Minus, Plus } from 'lucide-react'
import { TIER_COLOR_MAP } from '../edit/TableTierManager'

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

interface TierOption {
  id: string
  name: string
  description: string | null
  price: number
  quantity: number
  color: string
}

interface Props {
  show: ShowInfo
  user: UserInfo
  tiers: TierOption[]
}

const INVENTORY_OPTIONS = [
  { value: 'sealed',      label: 'Sealed Product', icon: '📦', desc: 'Booster boxes, ETBs, packs' },
  { value: 'raw_singles', label: 'Raw Singles',    icon: '🃏', desc: 'Ungraded individual cards' },
  { value: 'graded',      label: 'Graded Cards',   icon: '⭐', desc: 'PSA, CGC, BGS, SGC slabs' },
  { value: 'accessories', label: 'Accessories',    icon: '🛍️', desc: 'Sleeves, binders, display cases' },
  { value: 'mixed',       label: 'Mixed',          icon: '🎴', desc: 'Combination of the above' },
  { value: 'other',       label: 'Other',          icon: '✨', desc: 'Something else' },
]

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ApplicationForm({ show, user, tiers }: Props) {
  const [selectedTierId, setSelectedTierId] = useState('')
  const [requestedQuantity, setRequestedQuantity] = useState(1)
  const [inventoryTypes, setInventoryTypes] = useState<string[]>([])
  const [estimatedValue, setEstimatedValue] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [applicationNote, setApplicationNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const selectedTier = tiers.find((t) => t.id === selectedTierId)

  function handleTierSelect(tierId: string) {
    if (selectedTierId === tierId) {
      setSelectedTierId('')
      setRequestedQuantity(1)
    } else {
      setSelectedTierId(tierId)
      setRequestedQuantity(1)
    }
  }

  function adjustQuantity(delta: number) {
    setRequestedQuantity((q) => {
      const next = q + delta
      if (next < 1) return 1
      return next
    })
  }

  function toggleInventoryType(value: string) {
    setInventoryTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

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
          tableTierId: selectedTierId || null,
          requestedQuantity,
          inventoryTypes,
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
        {selectedTier && (
          <p className="text-ps-secondary text-sm mb-1">
            Requested: <span className="font-semibold text-ps-text">{requestedQuantity}× {selectedTier.name}</span>
            {selectedTier.price > 0 && <span className="text-ps-muted"> (${(selectedTier.price * requestedQuantity).toLocaleString()} total)</span>}
          </p>
        )}
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
        <h2 className="text-xs font-semibold text-ps-muted uppercase tracking-wide mb-4">Your Info</h2>
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
              ) : user.name}
            </div>
            <div className="text-xs text-ps-muted">{user.email}</div>
          </div>
        </div>
      </div>

      {/* Table tier selection */}
      {tiers.length > 0 && (
        <div className="bg-white border border-ps-borderLight rounded-3xl p-6 shadow-card mb-4">
          <h2 className="font-semibold text-ps-text mb-1">Select a Table Tier</h2>
          <p className="text-xs text-ps-muted mb-4">Choose the type of table you&apos;d like — the organizer has final say on assignments.</p>
          <div className="space-y-2 mb-4">
            {tiers.map((tier) => {
              const c = TIER_COLOR_MAP[tier.color] ?? TIER_COLOR_MAP.gray
              const selected = selectedTierId === tier.id
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => handleTierSelect(tier.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border text-left transition-all ${
                    selected
                      ? `${c.bg} ${c.border} ring-2 ring-offset-1 ring-current ${c.text}`
                      : 'bg-ps-surface2 border-ps-borderLight hover:border-ps-border hover:bg-white'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full shrink-0 ${c.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold ${selected ? c.text : 'text-ps-text'}`}>
                      {tier.name}
                    </div>
                    {tier.description && (
                      <div className="text-xs text-ps-muted mt-0.5">{tier.description}</div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className={`text-sm font-bold ${selected ? c.text : 'text-ps-text'}`}>
                      {tier.price > 0 ? `$${tier.price.toLocaleString()}` : 'Free'}
                    </div>
                    {tier.price > 0 && <div className="text-xs text-ps-muted">per table</div>}
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 transition-all ${
                    selected ? `${c.border} ${c.dot}` : 'border-ps-border bg-white'
                  }`}>
                    {selected && <div className="w-full h-full rounded-full flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-white" /></div>}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Quantity selector — only shown when a tier is selected */}
          {selectedTier && (
            <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${TIER_COLOR_MAP[selectedTier.color]?.bg ?? 'bg-gray-50'} ${TIER_COLOR_MAP[selectedTier.color]?.border ?? 'border-gray-200'}`}>
              <div>
                <p className={`text-sm font-semibold ${TIER_COLOR_MAP[selectedTier.color]?.text ?? 'text-gray-700'}`}>
                  How many {selectedTier.name} tables?
                </p>
                {selectedTier.price > 0 && requestedQuantity > 1 && (
                  <p className="text-xs text-ps-muted mt-0.5">
                    ${(selectedTier.price * requestedQuantity).toLocaleString()} total
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => adjustQuantity(-1)}
                  disabled={requestedQuantity <= 1}
                  className="w-8 h-8 rounded-full bg-white border border-ps-borderLight flex items-center justify-center text-ps-text hover:border-ps-accent disabled:opacity-40 transition-all"
                >
                  <Minus size={13} />
                </button>
                <span className="text-lg font-bold text-ps-text w-6 text-center tabular-nums">
                  {requestedQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => adjustQuantity(1)}
                  className="w-8 h-8 rounded-full bg-white border border-ps-borderLight flex items-center justify-center text-ps-text hover:border-ps-accent transition-all"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Application form */}
      <form onSubmit={handleSubmit} className="bg-white border border-ps-borderLight rounded-3xl p-6 shadow-card space-y-6">
        <h2 className="font-semibold text-ps-text">Application Details</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {/* Inventory Type — multi-select */}
        <div>
          <label className="block text-sm font-medium text-ps-text mb-1">
            What will you be selling? <span className="text-ps-muted font-normal">(select all that apply)</span>
          </label>
          <p className="text-xs text-ps-muted mb-3">Optional — helps the organizer understand your inventory</p>
          <div className="space-y-2">
            {INVENTORY_OPTIONS.map((opt) => {
              const selected = inventoryTypes.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleInventoryType(opt.value)}
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
                  {/* Checkbox indicator */}
                  <div className={`w-4 h-4 rounded border-2 shrink-0 transition-all flex items-center justify-center ${
                    selected ? 'border-ps-accent bg-ps-accent' : 'border-ps-border bg-white'
                  }`}>
                    {selected && (
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3L3.5 5.5L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
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
