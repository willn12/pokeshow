'use client'
import { useState, useEffect, useCallback } from 'react'
import { ExternalLink, Link2, Globe, Clock, TrendingUp, Users, RotateCcw } from 'lucide-react'

interface VendorUser {
  id: string
  name: string
  businessName: string | null
  bio: string | null
  email: string
}

interface Vendor {
  id: string
  status: string
  tableNumber: string | null
  inventoryType: string | null
  estimatedValue: number | null
  instagramUrl: string | null
  websiteUrl: string | null
  applicationNote: string | null
  createdAt: string
  pastShowCount: number
  user: VendorUser
}

interface ShowMeta {
  createdAt: string
  applicationsOpenAt: string | null
}

type Filter = 'all' | 'pending' | 'approved' | 'rejected'

const INVENTORY_LABELS: Record<string, { label: string; icon: string }> = {
  sealed:      { label: 'Sealed Product', icon: '📦' },
  raw_singles: { label: 'Raw Singles',    icon: '🃏' },
  graded:      { label: 'Graded Cards',   icon: '⭐' },
  accessories: { label: 'Accessories',    icon: '🛍️' },
  mixed:       { label: 'Mixed',          icon: '🎴' },
  other:       { label: 'Other',          icon: '✨' },
}

function relativeTime(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function absoluteDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function timeAfterOpening(appliedAt: string, openedAt: string | null): string | null {
  if (!openedAt) return null
  const diff = new Date(appliedAt).getTime() - new Date(openedAt).getTime()
  if (diff < 0) return null
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m after opening`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h after opening`
  return `${Math.floor(hrs / 24)}d after opening`
}

// ── Status badge ─────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:  'bg-amber-50  border-amber-200  text-amber-700',
    approved: 'bg-green-50  border-green-200  text-green-700',
    rejected: 'bg-gray-100  border-gray-200   text-gray-500',
    invited:  'bg-blue-50   border-blue-200   text-blue-700',
  }
  const label: Record<string, string> = {
    pending: '⏳ Pending', approved: '✓ Approved', rejected: 'Rejected', invited: 'Invited',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status] ?? 'bg-gray-100 border-gray-200 text-gray-500'}`}>
      {label[status] ?? status}
    </span>
  )
}

// ── Avatar ────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  return (
    <div className="w-10 h-10 rounded-2xl bg-ps-accentLight text-ps-accent font-bold text-sm flex items-center justify-center shrink-0">
      {name[0].toUpperCase()}
    </div>
  )
}

// ── Vendor Card ───────────────────────────────────

function VendorCard({
  vendor, showMeta, onStatusChange,
}: {
  vendor: Vendor
  showMeta: ShowMeta
  onStatusChange: (id: string, status: string, tableNumber?: string) => void
}) {
  const [tableInput, setTableInput] = useState(vendor.tableNumber ?? '')
  const afterOpening = timeAfterOpening(vendor.createdAt, showMeta.applicationsOpenAt)
  const displayName = vendor.user.businessName || vendor.user.name
  const realName = vendor.user.businessName ? vendor.user.name : null
  const inv = vendor.inventoryType ? INVENTORY_LABELS[vendor.inventoryType] : null

  const instagramHref = vendor.instagramUrl
    ? vendor.instagramUrl.startsWith('http')
      ? vendor.instagramUrl
      : `https://instagram.com/${vendor.instagramUrl.replace(/^@/, '')}`
    : null

  return (
    <div className="border border-ps-borderLight rounded-2xl overflow-hidden">

      {/* Card header */}
      <div className="flex items-start gap-3 p-4 bg-white">
        <Avatar name={displayName} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
            <span className="font-semibold text-ps-text text-sm leading-tight">{displayName}</span>
            {realName && <span className="text-ps-muted text-xs">({realName})</span>}
          </div>
          <p className="text-xs text-ps-muted mb-1.5">{vendor.user.email}</p>
          <div className="flex flex-wrap gap-1.5">
            <StatusBadge status={vendor.status} />
            {vendor.pastShowCount > 0 && (
              <span className="inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                ✓ Past vendor · {vendor.pastShowCount} show{vendor.pastShowCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Meta strip */}
      <div className="bg-ps-surface2 border-t border-ps-borderLight px-4 py-2.5 flex flex-wrap gap-x-3 gap-y-1 items-center">
        <span className="flex items-center gap-1 text-xs text-ps-muted">
          <Clock size={10} className="shrink-0" />
          {relativeTime(vendor.createdAt)} · {absoluteDate(vendor.createdAt)}
        </span>
        {afterOpening && (
          <span className="text-xs font-semibold text-ps-accent">
            {afterOpening}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="bg-white border-t border-ps-borderLight px-4 py-3 space-y-2.5">
        {/* Inventory + value */}
        {(inv || vendor.estimatedValue != null) && (
          <div className="flex flex-wrap gap-2">
            {inv && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-ps-surface2 border border-ps-borderLight px-2.5 py-1 rounded-full text-ps-secondary font-medium">
                {inv.icon} {inv.label}
              </span>
            )}
            {vendor.estimatedValue != null && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-ps-surface2 border border-ps-borderLight px-2.5 py-1 rounded-full text-ps-secondary font-medium">
                ~${vendor.estimatedValue.toLocaleString()} est. value
              </span>
            )}
          </div>
        )}

        {/* Social links */}
        {(instagramHref || vendor.websiteUrl) && (
          <div className="flex flex-wrap gap-3">
            {instagramHref && (
              <a href={instagramHref} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-ps-accent hover:text-ps-accentHover font-medium transition-colors">
                <Link2 size={12} />
                {vendor.instagramUrl}
              </a>
            )}
            {vendor.websiteUrl && (
              <a href={vendor.websiteUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-ps-accent hover:text-ps-accentHover font-medium transition-colors">
                <Globe size={12} />
                Website <ExternalLink size={10} />
              </a>
            )}
          </div>
        )}

        {/* Application note */}
        {vendor.applicationNote && (
          <div className="flex gap-2.5">
            <div className="w-0.5 bg-ps-accent rounded-full shrink-0 my-0.5" />
            <p className="text-xs text-ps-secondary leading-relaxed italic">{vendor.applicationNote}</p>
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="bg-ps-surface2 border-t border-ps-borderLight px-4 py-3">
        {vendor.status === 'pending' && (
          <div className="flex gap-2">
            <button
              onClick={() => onStatusChange(vendor.id, 'approved')}
              className="flex-1 sm:flex-none text-xs bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              Approve
            </button>
            <button
              onClick={() => onStatusChange(vendor.id, 'rejected')}
              className="flex-1 sm:flex-none text-xs bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              Decline
            </button>
          </div>
        )}

        {vendor.status === 'approved' && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-green-600 font-semibold shrink-0">✓ Approved</span>
            <div className="flex items-center gap-2">
              <label className="text-xs text-ps-muted shrink-0">Table</label>
              <input
                type="text"
                placeholder="—"
                value={tableInput}
                onChange={(e) => setTableInput(e.target.value)}
                onBlur={() => onStatusChange(vendor.id, 'approved', tableInput)}
                className="w-16 bg-white border border-ps-border rounded-lg px-2.5 py-1.5 text-xs text-center focus:outline-none focus:border-ps-accent transition-colors"
              />
            </div>
            <button
              onClick={() => onStatusChange(vendor.id, 'rejected')}
              className="ml-auto text-xs text-gray-400 hover:text-gray-600 transition-colors font-medium"
            >
              Revoke
            </button>
          </div>
        )}

        {vendor.status === 'rejected' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">Declined</span>
            <button
              onClick={() => onStatusChange(vendor.id, 'pending')}
              className="inline-flex items-center gap-1 text-xs bg-white hover:bg-amber-50 text-amber-600 border border-amber-200 font-semibold px-3 py-1.5 rounded-xl transition-colors ml-auto"
            >
              <RotateCcw size={10} /> Reconsider
            </button>
          </div>
        )}

        {vendor.status === 'invited' && (
          <span className="text-xs text-blue-600 font-medium">Invited — awaiting signup</span>
        )}
      </div>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────

function Skeleton() {
  return (
    <div className="border border-ps-borderLight rounded-2xl overflow-hidden animate-pulse">
      <div className="flex gap-3 p-4 bg-white">
        <div className="w-10 h-10 rounded-2xl bg-ps-surface2 shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3 bg-ps-surface2 rounded w-32" />
          <div className="h-2.5 bg-ps-surface2 rounded w-44" />
          <div className="h-5 bg-ps-surface2 rounded-full w-16" />
        </div>
      </div>
      <div className="bg-ps-surface2 h-8 border-t border-ps-borderLight" />
    </div>
  )
}

// ── Main component ────────────────────────────────

export default function VendorDashboard({ slug }: { slug: string }) {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [showMeta, setShowMeta] = useState<ShowMeta>({ createdAt: new Date().toISOString(), applicationsOpenAt: null })
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/shows/${slug}/vendors`)
      if (!res.ok) return
      const data = await res.json()
      setVendors(data.vendors ?? [])
      setShowMeta(data.show ?? { createdAt: new Date().toISOString(), applicationsOpenAt: null })
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { load() }, [load])

  async function handleStatusChange(vendorId: string, status: string, tableNumber?: string) {
    await fetch(`/api/shows/${slug}/vendors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendorId, status, tableNumber }),
    })
    setVendors((prev) =>
      prev.map((v) =>
        v.id === vendorId
          ? { ...v, status, tableNumber: tableNumber !== undefined ? tableNumber : v.tableNumber }
          : v
      )
    )
  }

  // Counts
  const counts = {
    all:      vendors.length,
    pending:  vendors.filter((v) => v.status === 'pending').length,
    approved: vendors.filter((v) => v.status === 'approved').length,
    rejected: vendors.filter((v) => v.status === 'rejected').length,
  }

  const filtered = filter === 'all' ? vendors : vendors.filter((v) => v.status === filter)

  // Insights
  const sorted = [...vendors].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  const firstApp = sorted[0]
  const openMs = showMeta.applicationsOpenAt ? new Date(showMeta.applicationsOpenAt).getTime() : null
  const within24h = openMs != null
    ? vendors.filter((v) => new Date(v.createdAt).getTime() - openMs < 86_400_000).length
    : null
  const returnCount = vendors.filter((v) => v.pastShowCount > 0).length

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-ps-surface2 rounded-2xl h-16 animate-pulse" />
          ))}
        </div>
        <Skeleton />
        <Skeleton />
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Stats — 2×2 on mobile, 4-col on sm+ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',    value: counts.all,      color: 'text-ps-text',    sub: 'applications' },
          { label: 'Pending',  value: counts.pending,  color: 'text-amber-600',  sub: 'awaiting review' },
          { label: 'Approved', value: counts.approved, color: 'text-green-600',  sub: 'confirmed' },
          { label: 'Declined', value: counts.rejected, color: 'text-gray-400',   sub: 'not accepted' },
        ].map((s) => (
          <div key={s.label} className="bg-ps-surface2 border border-ps-borderLight rounded-2xl px-4 py-3 text-center">
            <div className={`text-2xl font-bold tracking-tight ${s.color}`}>{s.value}</div>
            <div className="text-xs font-semibold text-ps-text mt-0.5">{s.label}</div>
            <div className="text-xs text-ps-muted">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Insights */}
      {vendors.length > 0 && (
        <div className="border border-ps-borderLight rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-ps-surface2 border-b border-ps-borderLight">
            <TrendingUp size={13} className="text-ps-accent" />
            <span className="text-xs font-semibold text-ps-text uppercase tracking-wide">Insights</span>
          </div>
          <div className="divide-y divide-ps-borderLight">
            {firstApp && (
              <div className="flex items-center justify-between px-4 py-2.5 bg-white">
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-ps-muted shrink-0" />
                  <span className="text-xs text-ps-secondary">First application</span>
                </div>
                <span className="text-xs font-semibold text-ps-text text-right">
                  {timeAfterOpening(firstApp.createdAt, showMeta.applicationsOpenAt) ?? relativeTime(firstApp.createdAt)}
                </span>
              </div>
            )}
            {within24h !== null && (
              <div className="flex items-center justify-between px-4 py-2.5 bg-white">
                <div className="flex items-center gap-2">
                  <TrendingUp size={12} className="text-ps-muted shrink-0" />
                  <span className="text-xs text-ps-secondary">Within first 24 hours</span>
                </div>
                <span className="text-xs font-semibold text-ps-text">{within24h} applicant{within24h !== 1 ? 's' : ''}</span>
              </div>
            )}
            {returnCount > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 bg-white">
                <div className="flex items-center gap-2">
                  <Users size={12} className="text-ps-muted shrink-0" />
                  <span className="text-xs text-ps-secondary">Return vendors</span>
                </div>
                <span className="text-xs font-semibold text-green-600">{returnCount} vendor{returnCount !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      {vendors.length > 0 && (
        <div className="flex gap-1 bg-ps-surface2 border border-ps-borderLight rounded-xl p-1">
          {(['all', 'pending', 'approved', 'rejected'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-2 rounded-lg transition-all capitalize ${
                filter === f
                  ? 'bg-white shadow-soft text-ps-text border border-ps-borderLight'
                  : 'text-ps-muted hover:text-ps-secondary'
              }`}
            >
              {f}
              {counts[f] > 0 && (
                <span className={`text-xs ${filter === f ? 'text-ps-accent' : 'text-ps-muted opacity-70'}`}>
                  {counts[f]}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Vendor list */}
      {vendors.length === 0 ? (
        <div className="text-center py-12 px-4">
          <div className="text-3xl mb-3">📭</div>
          <p className="text-ps-text font-semibold text-sm">No applications yet</p>
          <p className="text-ps-muted text-xs mt-1">
            Vendors can apply from your show page, or you can invite them directly.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-ps-muted text-sm">
          No {filter} applications.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              showMeta={showMeta}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}
