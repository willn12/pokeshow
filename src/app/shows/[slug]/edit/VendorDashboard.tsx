'use client'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  TrendingUp, Users, DollarSign, RotateCcw,
  Link2, Globe, ExternalLink, ChevronDown, ChevronUp,
  Check, X, Search, ChevronsUpDown, MessageSquare, Mail, Send, Loader2,
} from 'lucide-react'
import { TIER_COLOR_MAP } from './TableTierManager'

// ─── Types ────────────────────────────────────────────────────────────────────

type VendorStatus = 'pending' | 'approved' | 'confirmed' | 'rejected' | 'invited'

interface VendorUser { id: string; name: string; businessName: string | null; bio: string | null; email: string }
interface TierInfo   { id: string; name: string; color: string; price: number }
interface Tier       { id: string; name: string; color: string; price: number; quantity: number }
interface ShowMeta   { createdAt: string; applicationsOpenAt: string | null }

interface Vendor {
  id: string; status: VendorStatus
  tableNumber: string | null; tableTierId: string | null; tableTier: TierInfo | null
  requestedQuantity: number; approvedQuantity: number | null
  inventoryTypes: string[]; estimatedValue: number | null
  instagramUrl: string | null; websiteUrl: string | null; applicationNote: string | null
  createdAt: string; pastShowCount: number; user: VendorUser
}

type Filter     = 'all' | 'pending' | 'approved' | 'confirmed' | 'rejected'
type SortKey    = 'name' | 'applied' | 'status'
type BlastGroup = 'approved' | 'confirmed' | 'active' | 'pending' | 'all'

// ─── Constants ────────────────────────────────────────────────────────────────

const INVENTORY_LABELS: Record<string, { label: string; icon: string }> = {
  sealed:      { label: 'Sealed',      icon: '📦' },
  raw_singles: { label: 'Raw Singles', icon: '🃏' },
  graded:      { label: 'Graded',      icon: '⭐' },
  accessories: { label: 'Accessories', icon: '🛍️' },
  mixed:       { label: 'Mixed',       icon: '🎴' },
  other:       { label: 'Other',       icon: '✨' },
}

const STATUS_META: Record<string, { label: string; dot: string; text: string; bg: string; rowAccent: string }> = {
  pending:   { label: 'Pending',   dot: 'bg-amber-400',  text: 'text-amber-700',  bg: 'bg-amber-50',   rowAccent: 'border-l-amber-400'  },
  approved:  { label: 'Approved',  dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50',   rowAccent: 'border-l-green-500'  },
  confirmed: { label: 'Confirmed', dot: 'bg-purple-500', text: 'text-purple-700', bg: 'bg-purple-50',  rowAccent: 'border-l-purple-500' },
  rejected:  { label: 'Declined',  dot: 'bg-gray-300',   text: 'text-gray-500',   bg: 'bg-gray-100',   rowAccent: 'border-l-gray-300'   },
  invited:   { label: 'Invited',   dot: 'bg-blue-400',   text: 'text-blue-700',   bg: 'bg-blue-50',    rowAccent: 'border-l-blue-400'   },
}

const GRID_COLS = '2fr 110px 1.5fr 1fr 100px 200px'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function fullDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function timeAfterOpening(appliedAt: string, openedAt: string | null) {
  if (!openedAt) return null
  const diff = new Date(appliedAt).getTime() - new Date(openedAt).getTime()
  if (diff < 0) return null
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m after open`
  const hrs = Math.floor(mins / 60)
  return hrs < 24 ? `${hrs}h after open` : `${Math.floor(hrs / 24)}d after open`
}

// ─── Application Modal ────────────────────────────────────────────────────────

function ApplicationModal({
  vendor, tiers, showMeta, onClose, onStatusChange,
}: {
  vendor: Vendor; tiers: Tier[]; showMeta: ShowMeta
  onClose: () => void
  onStatusChange: (id: string, status: VendorStatus, tableNumber?: string, tableTierId?: string, approvedQuantity?: number) => void
}) {
  const [tierId, setTierId]     = useState(vendor.tableTierId ?? '')
  const [qty, setQty]           = useState(vendor.approvedQuantity ?? vendor.requestedQuantity)
  const [tableNum, setTableNum] = useState(vendor.tableNumber ?? '')
  const backdropRef             = useRef<HTMLDivElement>(null)

  const st = STATUS_META[vendor.status] ?? STATUS_META.rejected
  const displayName = vendor.user.businessName || vendor.user.name
  const realName = vendor.user.businessName ? vendor.user.name : null
  const invLabels = (vendor.inventoryTypes ?? []).map((t) => INVENTORY_LABELS[t]).filter(Boolean)
  const afterOpening = timeAfterOpening(vendor.createdAt, showMeta.applicationsOpenAt)
  const selectedTier = tiers.find((t) => t.id === tierId) ?? null

  const instagramHref = vendor.instagramUrl
    ? vendor.instagramUrl.startsWith('http') ? vendor.instagramUrl
      : `https://instagram.com/${vendor.instagramUrl.replace(/^@/, '')}`
    : null

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleConfirm() {
    onStatusChange(vendor.id, 'approved', tableNum || undefined, tierId || undefined, qty)
    onClose()
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === backdropRef.current) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="shrink-0 px-6 py-5 border-b border-ps-borderLight flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-ps-accentLight text-ps-accent font-bold text-base flex items-center justify-center shrink-0">
            {displayName[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-ps-text text-base leading-tight">{displayName}</span>
              {vendor.pastShowCount > 0 && (
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">
                  <Users size={8} /> Returning vendor
                </span>
              )}
            </div>
            {realName && <p className="text-sm text-ps-muted">{realName}</p>}
            <p className="text-xs text-ps-muted">{vendor.user.email}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${st.bg} ${st.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
              {st.label}
            </span>
            <button onClick={onClose} className="text-ps-muted hover:text-ps-text transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto divide-y divide-ps-borderLight">

          {/* Bio */}
          {vendor.user.bio && (
            <div className="px-6 py-4">
              <p className="text-xs font-semibold text-ps-muted uppercase tracking-wide mb-2">About</p>
              <p className="text-sm text-ps-text leading-relaxed">{vendor.user.bio}</p>
            </div>
          )}

          {/* Inventory */}
          {invLabels.length > 0 && (
            <div className="px-6 py-4">
              <p className="text-xs font-semibold text-ps-muted uppercase tracking-wide mb-2">What they sell</p>
              <div className="flex flex-wrap gap-1.5">
                {invLabels.map((inv) => (
                  <span key={inv.label} className="inline-flex items-center gap-1.5 text-xs font-medium text-ps-text bg-gray-50 border border-ps-borderLight px-2.5 py-1 rounded-full">
                    {inv.icon} {inv.label}
                  </span>
                ))}
              </div>
              {vendor.estimatedValue != null && (
                <p className="text-xs text-ps-muted mt-2">
                  Estimated inventory value: <span className="font-semibold text-ps-text">${vendor.estimatedValue.toLocaleString()}</span>
                </p>
              )}
            </div>
          )}

          {/* Application note */}
          {vendor.applicationNote && (
            <div className="px-6 py-4">
              <p className="text-xs font-semibold text-ps-muted uppercase tracking-wide mb-2 flex items-center gap-1">
                <MessageSquare size={10} /> Note from vendor
              </p>
              <p className="text-sm text-ps-text leading-relaxed">{vendor.applicationNote}</p>
            </div>
          )}

          {/* Links */}
          {(instagramHref || vendor.websiteUrl) && (
            <div className="px-6 py-4">
              <p className="text-xs font-semibold text-ps-muted uppercase tracking-wide mb-2">Links</p>
              <div className="flex flex-col gap-2">
                {instagramHref && (
                  <a href={instagramHref} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-ps-accent hover:text-ps-accentHover font-medium transition-colors">
                    <Link2 size={13} /> @{vendor.instagramUrl?.replace(/^@/, '')} <ExternalLink size={11} className="opacity-60" />
                  </a>
                )}
                {vendor.websiteUrl && (
                  <a href={vendor.websiteUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-ps-accent hover:text-ps-accentHover font-medium transition-colors">
                    <Globe size={13} /> {vendor.websiteUrl.replace(/^https?:\/\//, '')} <ExternalLink size={11} className="opacity-60" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Applied */}
          <div className="px-6 py-4">
            <p className="text-xs font-semibold text-ps-muted uppercase tracking-wide mb-1">Applied</p>
            <p className="text-sm text-ps-text">{fullDate(vendor.createdAt)}</p>
            {afterOpening && <p className="text-xs text-ps-accent font-semibold mt-0.5">{afterOpening}</p>}
          </div>

          {/* Pending: requested → granting (always visible, no click required) */}
          {vendor.status === 'pending' && (
            <div className="px-6 py-5 space-y-4">

              {/* Requested (read-only) */}
              <div>
                <p className="text-xs font-semibold text-ps-muted uppercase tracking-wide mb-2">Requested</p>
                <div className="bg-gray-50 border border-ps-borderLight rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
                  {vendor.tableTier ? (
                    (() => {
                      const c = TIER_COLOR_MAP[vendor.tableTier.color] ?? TIER_COLOR_MAP.gray
                      return (
                        <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full border ${c.bg} ${c.border} ${c.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                          {vendor.tableTier.name}
                        </span>
                      )
                    })()
                  ) : (
                    <span className="text-sm text-ps-muted italic">No tier specified</span>
                  )}
                  <span className="text-sm font-semibold text-ps-text">
                    {vendor.requestedQuantity} table{vendor.requestedQuantity !== 1 ? 's' : ''}
                  </span>
                  {vendor.tableTier && vendor.tableTier.price > 0 && (
                    <span className="text-sm text-ps-muted">
                      ${(vendor.tableTier.price * vendor.requestedQuantity).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Granting (editable) */}
              <div>
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Granting</p>
                <div className="bg-green-50/60 border border-green-200 rounded-xl px-4 py-4 space-y-3">
                  {/* Tier */}
                  {tiers.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-ps-muted mb-1.5">Tier</label>
                      <div className="relative">
                        <select
                          value={tierId}
                          onChange={(e) => setTierId(e.target.value)}
                          className="appearance-none w-full bg-white border border-ps-border rounded-lg px-3 py-2 text-sm text-ps-text focus:outline-none focus:border-ps-accent transition-colors pr-8"
                        >
                          <option value="">No tier</option>
                          {tiers.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}{t.price > 0 ? ` — $${t.price}` : ''}</option>
                          ))}
                        </select>
                        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ps-muted pointer-events-none" />
                      </div>
                    </div>
                  )}

                  {/* Quantity + table number row */}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-ps-muted mb-1.5">Tables</label>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}
                          className="w-8 h-8 rounded-lg border border-ps-border bg-white text-ps-text font-bold flex items-center justify-center hover:bg-gray-50 transition-colors text-base">−</button>
                        <span className="text-base font-bold text-ps-text w-5 text-center tabular-nums">{qty}</span>
                        <button type="button" onClick={() => setQty((q) => q + 1)}
                          className="w-8 h-8 rounded-lg border border-ps-border bg-white text-ps-text font-bold flex items-center justify-center hover:bg-gray-50 transition-colors text-base">+</button>
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-ps-muted mb-1.5">Table # <span className="font-normal">(optional)</span></label>
                      <input
                        type="text"
                        value={tableNum}
                        onChange={(e) => setTableNum(e.target.value)}
                        placeholder="e.g. A4"
                        className="w-full bg-white border border-ps-border rounded-lg px-3 py-2 text-sm text-ps-text focus:outline-none focus:border-ps-accent transition-colors placeholder:text-ps-muted"
                      />
                    </div>
                  </div>

                  {/* Live price */}
                  {selectedTier && selectedTier.price > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs text-ps-muted">{qty}× {selectedTier.name}</span>
                      <span className="text-sm font-bold text-green-700">${(selectedTier.price * qty).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Approved / Confirmed summary */}
          {(vendor.status === 'approved' || vendor.status === 'confirmed') && vendor.tableTier && (
            <div className={`px-6 py-4 ${vendor.status === 'confirmed' ? 'bg-purple-50/50' : 'bg-green-50/50'}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${vendor.status === 'confirmed' ? 'text-purple-700' : 'text-green-700'}`}>
                {vendor.status === 'confirmed' ? 'Confirmed & Paid' : 'Approved as'}
              </p>
              {(() => {
                const c = TIER_COLOR_MAP[vendor.tableTier!.color] ?? TIER_COLOR_MAP.gray
                const approvedQty = vendor.approvedQuantity ?? vendor.requestedQuantity
                const total = vendor.tableTier!.price * approvedQty
                return (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border ${c.bg} ${c.border} ${c.text}`}>
                      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                      {approvedQty > 1 ? `${approvedQty}× ` : ''}{vendor.tableTier!.name}
                    </span>
                    {total > 0 && <span className="text-sm font-semibold text-green-700">${total.toLocaleString()}</span>}
                    {vendor.tableNumber && <span className="text-sm text-ps-muted">Table {vendor.tableNumber}</span>}
                  </div>
                )
              })()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-ps-borderLight bg-white">
          {vendor.status === 'pending' && (
            <div className="flex gap-2">
              <button
                onClick={handleConfirm}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                <Check size={15} /> Confirm Approval
              </button>
              <button
                onClick={() => { onStatusChange(vendor.id, 'rejected'); onClose() }}
                className="flex items-center gap-1.5 font-semibold text-sm text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 px-5 py-2.5 rounded-xl transition-all">
                <X size={14} /> Decline
              </button>
            </div>
          )}

          {vendor.status === 'approved' && (
            <div className="space-y-2">
              <button
                onClick={() => { onStatusChange(vendor.id, 'confirmed'); onClose() }}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                <DollarSign size={14} /> Mark as Paid — Confirm Spot
              </button>
              <button
                onClick={() => { onStatusChange(vendor.id, 'rejected'); onClose() }}
                className="w-full text-xs text-gray-400 hover:text-red-500 transition-colors font-medium py-1">
                Revoke approval
              </button>
            </div>
          )}

          {vendor.status === 'confirmed' && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-purple-600 flex items-center gap-1.5"><Check size={14} /> Confirmed &amp; Paid</span>
              <button
                onClick={() => { onStatusChange(vendor.id, 'approved'); onClose() }}
                className="text-xs text-gray-400 hover:text-amber-600 transition-colors font-medium">
                Revert to Approved
              </button>
            </div>
          )}

          {vendor.status === 'rejected' && (
            <button
              onClick={() => { onStatusChange(vendor.id, 'pending'); onClose() }}
              className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 py-2.5 rounded-xl transition-all">
              <RotateCcw size={13} /> Move back to Pending
            </button>
          )}

          {vendor.status === 'invited' && (
            <p className="text-sm text-ps-muted text-center py-0.5">Awaiting vendor signup</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Sort header ──────────────────────────────────────────────────────────────

function SortHeader({ label, column, sort, onSort }: {
  label: string; column: SortKey
  sort: { key: SortKey; dir: 'asc' | 'desc' }
  onSort: (k: SortKey) => void
}) {
  const active = sort.key === column
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onSort(column) }}
      className={`flex items-center gap-1 text-left hover:text-ps-text transition-colors group ${active ? 'text-ps-text' : 'text-ps-muted'}`}
    >
      <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      <span className="text-ps-muted">
        {active
          ? (sort.dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
          : <ChevronsUpDown size={11} className="opacity-40 group-hover:opacity-70" />}
      </span>
    </button>
  )
}

// ─── Table row ────────────────────────────────────────────────────────────────

function VendorRow({
  vendor, showMeta, onOpenModal, onStatusChange,
}: {
  vendor: Vendor; showMeta: ShowMeta
  onOpenModal: (id: string) => void
  onStatusChange: (id: string, status: VendorStatus) => void
}) {
  const st = STATUS_META[vendor.status] ?? STATUS_META.rejected
  const displayName = vendor.user.businessName || vendor.user.name
  const afterOpening = timeAfterOpening(vendor.createdAt, showMeta.applicationsOpenAt)

  const instagramHref = vendor.instagramUrl
    ? vendor.instagramUrl.startsWith('http') ? vendor.instagramUrl
      : `https://instagram.com/${vendor.instagramUrl.replace(/^@/, '')}`
    : null

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenModal(vendor.id)}
      onKeyDown={(e) => e.key === 'Enter' && onOpenModal(vendor.id)}
      className={`grid items-center border-b border-ps-borderLight border-l-4 cursor-pointer transition-colors min-w-[700px] bg-white hover:bg-gray-50 ${st.rowAccent}`}
      style={{ gridTemplateColumns: GRID_COLS }}
    >
      {/* VENDOR */}
      <div className="px-4 py-3.5 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-ps-accentLight text-ps-accent font-bold text-xs flex items-center justify-center shrink-0">
            {displayName[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-ps-text text-sm">{displayName}</span>
              {vendor.pastShowCount > 0 && (
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full shrink-0">
                  <Users size={8} /> Returning
                </span>
              )}
            </div>
            <p className="text-xs text-ps-muted truncate">{vendor.user.email}</p>
            {vendor.applicationNote && (
              <div className="flex items-center gap-1 mt-0.5">
                <MessageSquare size={9} className="text-ps-muted shrink-0" />
                <p className="text-xs text-ps-muted italic truncate">{vendor.applicationNote}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STATUS */}
      <div className="px-3 py-3.5">
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${st.bg} ${st.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
          {st.label}
        </span>
      </div>

      {/* REQUESTED */}
      <div className="px-3 py-3.5">
        {vendor.tableTier ? (
          (() => {
            const c = TIER_COLOR_MAP[vendor.tableTier.color] ?? TIER_COLOR_MAP.gray
            return (
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border ${c.bg} ${c.border} ${c.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                {vendor.requestedQuantity > 1 ? `${vendor.requestedQuantity}× ` : ''}{vendor.tableTier.name}
                {vendor.tableTier.price > 0 && (
                  <span className="opacity-60 font-normal ml-0.5">${(vendor.tableTier.price * vendor.requestedQuantity).toLocaleString()}</span>
                )}
              </span>
            )
          })()
        ) : vendor.requestedQuantity > 1 ? (
          <span className="text-xs text-ps-secondary">{vendor.requestedQuantity} tables</span>
        ) : (
          <span className="text-xs text-ps-muted">—</span>
        )}
        {vendor.status === 'approved' && vendor.approvedQuantity != null && vendor.approvedQuantity !== vendor.requestedQuantity && (
          <div className="flex items-center gap-1 mt-0.5">
            <Check size={9} className="text-green-500" />
            <span className="text-xs text-green-600">{vendor.approvedQuantity} approved</span>
          </div>
        )}
      </div>

      {/* SOCIALS */}
      <div className="px-3 py-3.5">
        <div className="flex flex-col gap-1">
          {instagramHref && (
            <a href={instagramHref} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-ps-accent hover:text-ps-accentHover font-medium transition-colors truncate">
              <Link2 size={10} className="shrink-0" />
              <span className="truncate">{vendor.instagramUrl?.replace(/^@/, '')}</span>
            </a>
          )}
          {vendor.websiteUrl && (
            <a href={vendor.websiteUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-ps-accent hover:text-ps-accentHover transition-colors">
              <Globe size={10} /> <ExternalLink size={9} />
            </a>
          )}
          {!instagramHref && !vendor.websiteUrl && <span className="text-xs text-ps-muted">—</span>}
        </div>
      </div>

      {/* APPLIED */}
      <div className="px-3 py-3.5">
        <p className="text-xs font-medium text-ps-text">{relativeTime(vendor.createdAt)}</p>
        {afterOpening && <p className="text-xs text-ps-accent font-semibold mt-0.5">{afterOpening}</p>}
      </div>

      {/* ACTIONS */}
      <div className="px-4 py-3.5 flex items-center gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
        {vendor.status === 'pending' && (
          <>
            <button
              onClick={() => onStatusChange(vendor.id, 'rejected')}
              className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 bg-white px-2.5 py-1.5 rounded-lg transition-all"
            >
              <X size={11} /> Decline
            </button>
            <button
              onClick={() => onOpenModal(vendor.id)}
              className="flex items-center gap-1.5 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-all"
            >
              <Check size={11} /> Approve
            </button>
          </>
        )}

        {vendor.status === 'approved' && (
          <button
            onClick={() => onStatusChange(vendor.id, 'confirmed')}
            className="flex items-center gap-1 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1.5 rounded-lg transition-all"
          >
            <DollarSign size={11} /> Mark Paid
          </button>
        )}

        {vendor.status === 'confirmed' && (
          <span className="text-xs text-purple-600 font-semibold flex items-center gap-1">
            <Check size={11} /> Confirmed
          </span>
        )}

        {vendor.status === 'rejected' && (
          <button
            onClick={() => onStatusChange(vendor.id, 'pending')}
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-lg transition-all"
          >
            <RotateCcw size={10} /> Reconsider
          </button>
        )}

        {vendor.status === 'invited' && (
          <span className="text-xs text-blue-500 font-medium">Awaiting signup</span>
        )}
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="grid items-center border-b border-ps-borderLight border-l-4 border-l-ps-borderLight bg-white animate-pulse min-w-[700px]"
      style={{ gridTemplateColumns: GRID_COLS }}>
      {[1, 2, 3, 4, 5, 6].map((_, i) => (
        <div key={i} className="px-4 py-4">
          <div className="h-3 bg-ps-surface2 rounded w-3/4" />
          {i === 0 && <div className="h-2.5 bg-ps-surface2 rounded mt-2 w-1/2" />}
        </div>
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function VendorDashboard({ slug }: { slug: string }) {
  const [vendors, setVendors]   = useState<Vendor[]>([])
  const [tiers, setTiers]       = useState<Tier[]>([])
  const [showMeta, setShowMeta] = useState<ShowMeta>({ createdAt: new Date().toISOString(), applicationsOpenAt: null })
  const [filter, setFilter]     = useState<Filter>('pending')
  const [search, setSearch]     = useState('')
  const [sort, setSort]         = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'applied', dir: 'asc' })
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState<string | null>(null)
  const blastTimerRef           = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (blastTimerRef.current) clearTimeout(blastTimerRef.current) }, [])

  // Blast email state
  const [blastOpen, setBlastOpen]       = useState(false)
  const [blastGroup, setBlastGroup]     = useState<BlastGroup>('active')
  const [blastSubject, setBlastSubject] = useState('')
  const [blastMessage, setBlastMessage] = useState('')
  const [blastSending, setBlastSending] = useState(false)
  const [blastSent, setBlastSent]       = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/shows/${slug}/vendors`)
      if (!res.ok) return
      const data = await res.json()
      setVendors(data.vendors ?? [])
      setTiers(data.tiers ?? [])
      setShowMeta(data.show ?? { createdAt: new Date().toISOString(), applicationsOpenAt: null })
    } finally { setLoading(false) }
  }, [slug])

  useEffect(() => { load() }, [load])

  async function handleStatusChange(vendorId: string, status: VendorStatus, tableNumber?: string, tableTierId?: string, approvedQuantity?: number) {
    const body: Record<string, unknown> = { vendorId, status }
    if (tableNumber !== undefined) body.tableNumber = tableNumber
    if (tableTierId !== undefined) body.tableTierId = tableTierId
    if (approvedQuantity !== undefined) body.approvedQuantity = approvedQuantity
    await fetch(`/api/shows/${slug}/vendors`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    setVendors((prev) => prev.map((v) => v.id !== vendorId ? v : {
      ...v, status,
      tableNumber:      tableNumber !== undefined      ? tableNumber || null  : v.tableNumber,
      tableTierId:      tableTierId !== undefined      ? tableTierId || null  : v.tableTierId,
      tableTier:        tableTierId !== undefined      ? (tableTierId ? (tiers.find((t) => t.id === tableTierId) ?? null) : null) : v.tableTier,
      approvedQuantity: approvedQuantity !== undefined ? approvedQuantity     : v.approvedQuantity,
    }))
  }

  async function sendBlast() {
    if (!blastSubject.trim() || !blastMessage.trim()) return
    setBlastSending(true)
    try {
      const res = await fetch(`/api/shows/${slug}/blast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group: blastGroup, subject: blastSubject.trim(), message: blastMessage.trim() }),
      })
      const data = await res.json()
      setBlastSent(data.sent ?? 0)
      setBlastSubject('')
      setBlastMessage('')
      blastTimerRef.current = setTimeout(() => setBlastOpen(false), 1200)
    } finally {
      setBlastSending(false)
    }
  }

  function handleSort(key: SortKey) {
    setSort((s) => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
  }

  const counts = {
    all:       vendors.length,
    pending:   vendors.filter((v) => v.status === 'pending').length,
    approved:  vendors.filter((v) => v.status === 'approved').length,
    confirmed: vendors.filter((v) => v.status === 'confirmed').length,
    rejected:  vendors.filter((v) => v.status === 'rejected').length,
  }

  const blastGroupCounts: Record<BlastGroup, number> = {
    approved:  counts.approved,
    confirmed: counts.confirmed,
    active:    counts.approved + counts.confirmed,
    pending:   counts.pending,
    all:       vendors.filter((v) => v.status !== 'rejected').length,
  }

  const filtered = useMemo(() => {
    let list = filter === 'all'
      ? vendors
      : vendors.filter((v) => v.status === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((v) =>
        v.user.name.toLowerCase().includes(q) ||
        v.user.email.toLowerCase().includes(q) ||
        (v.user.businessName ?? '').toLowerCase().includes(q)
      )
    }
    list = [...list].sort((a, b) => {
      if (a.pastShowCount > 0 && b.pastShowCount === 0) return -1
      if (a.pastShowCount === 0 && b.pastShowCount > 0) return 1
      let cmp = 0
      if (sort.key === 'name')    cmp = (a.user.businessName ?? a.user.name).localeCompare(b.user.businessName ?? b.user.name)
      if (sort.key === 'applied') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sort.key === 'status')  cmp = a.status.localeCompare(b.status)
      return sort.dir === 'asc' ? cmp : -cmp
    })
    return list
  }, [vendors, filter, search, sort])

  const paidRevenue = vendors
    .filter((v) => v.status === 'confirmed' && v.tableTier)
    .reduce((s, v) => s + (v.tableTier!.price * (v.approvedQuantity ?? v.requestedQuantity)), 0)
  const pendingRevenue = vendors
    .filter((v) => v.status === 'approved' && v.tableTier)
    .reduce((s, v) => s + (v.tableTier!.price * (v.approvedQuantity ?? v.requestedQuantity)), 0)
  const openMs = showMeta.applicationsOpenAt ? new Date(showMeta.applicationsOpenAt).getTime() : null
  const within24h = openMs != null ? vendors.filter((v) => new Date(v.createdAt).getTime() - openMs < 86_400_000).length : null
  const returnCount = vendors.filter((v) => v.pastShowCount > 0).length

  const modalVendor = modal ? vendors.find((v) => v.id === modal) ?? null : null

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="shrink-0 px-6 py-3 border-b border-ps-borderLight bg-white flex gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-10 w-28 bg-ps-surface2 rounded-lg animate-pulse" />)}
        </div>
        <div className="flex-1 overflow-hidden">
          {[1,2,3,4,5].map(i => <SkeletonRow key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col h-full">

        {/* Stats / filter bar */}
        <div className="shrink-0 px-6 py-3 border-b border-ps-borderLight bg-white flex flex-wrap items-center gap-2.5">
          {([
            { key: 'all',       label: 'All',       count: counts.all,       color: 'text-ps-text',    dot: ''              },
            { key: 'pending',   label: 'Pending',   count: counts.pending,   color: 'text-amber-600',  dot: 'bg-amber-400'  },
            { key: 'approved',  label: 'Approved',  count: counts.approved,  color: 'text-green-600',  dot: 'bg-green-500'  },
            { key: 'confirmed', label: 'Confirmed', count: counts.confirmed, color: 'text-purple-600', dot: 'bg-purple-500' },
            { key: 'rejected',  label: 'Declined',  count: counts.rejected,  color: 'text-gray-400',   dot: 'bg-gray-300'   },
          ] as const).map((s) => (
            <button key={s.key} onClick={() => setFilter(s.key)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-left transition-all ${
                filter === s.key
                  ? 'bg-white border-ps-accent shadow-soft ring-1 ring-ps-accentLight'
                  : 'bg-white border-ps-borderLight hover:border-ps-border'
              }`}>
              {s.dot && <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />}
              <span className={`text-base font-bold tabular-nums ${s.color}`}>{s.count}</span>
              <span className="text-xs font-semibold text-ps-muted">{s.label}</span>
            </button>
          ))}

          <div className="ml-auto flex flex-wrap gap-2">
            {paidRevenue > 0 && (
              <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 rounded-lg px-3 py-1.5">
                <DollarSign size={12} className="text-purple-600" />
                <span className="text-xs font-bold text-purple-700">${paidRevenue.toLocaleString()}</span>
                <span className="text-xs text-purple-600/70">paid</span>
              </div>
            )}
            {pendingRevenue > 0 && (
              <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                <DollarSign size={12} className="text-green-600" />
                <span className="text-xs font-bold text-green-700">${pendingRevenue.toLocaleString()}</span>
                <span className="text-xs text-green-600/70">pending</span>
              </div>
            )}
            {returnCount > 0 && (
              <div className="flex items-center gap-1.5 bg-white border border-ps-borderLight rounded-lg px-3 py-1.5">
                <Users size={12} className="text-ps-accent" />
                <span className="text-xs font-semibold text-ps-text">{returnCount} returning</span>
              </div>
            )}
            {within24h != null && within24h > 0 && (
              <div className="flex items-center gap-1.5 bg-white border border-ps-borderLight rounded-lg px-3 py-1.5">
                <TrendingUp size={12} className="text-ps-accent" />
                <span className="text-xs text-ps-secondary">{within24h} in first 24h</span>
              </div>
            )}
            <button
              onClick={() => { setBlastOpen(true); setBlastSent(null) }}
              className="flex items-center gap-1.5 bg-ps-accent hover:bg-ps-accentHover text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors"
            >
              <Mail size={12} /> Email Blast
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="shrink-0 px-6 py-2.5 border-b border-ps-borderLight bg-gray-50 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ps-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-8 pr-3 py-2 bg-white border border-ps-borderLight rounded-lg text-sm text-ps-text placeholder:text-ps-muted focus:outline-none focus:border-ps-accent transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ps-muted hover:text-ps-text">
                <X size={12} />
              </button>
            )}
          </div>
          <span className="text-xs text-ps-muted ml-auto">
            {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
          </span>
        </div>

        {/* Table */}
        {vendors.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="text-4xl mb-3">📭</div>
            <p className="font-semibold text-ps-text">No applications yet</p>
            <p className="text-sm text-ps-muted mt-1">Vendors can apply from the show page, or invite them directly.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-ps-muted text-sm">
            No results{search ? ` for "${search}"` : ''}.
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            {/* Sticky header */}
            <div className="sticky top-0 z-10 grid border-b border-ps-borderLight bg-gray-50 min-w-[700px]"
              style={{ gridTemplateColumns: GRID_COLS }}>
              <div className="px-4 py-2.5"><SortHeader label="Vendor" column="name" sort={sort} onSort={handleSort} /></div>
              <div className="px-3 py-2.5"><SortHeader label="Status" column="status" sort={sort} onSort={handleSort} /></div>
              <div className="px-3 py-2.5"><span className="text-xs font-semibold text-ps-muted uppercase tracking-wide">Requested</span></div>
              <div className="px-3 py-2.5"><span className="text-xs font-semibold text-ps-muted uppercase tracking-wide">Socials</span></div>
              <div className="px-3 py-2.5"><SortHeader label="Applied" column="applied" sort={sort} onSort={handleSort} /></div>
              <div className="px-4 py-2.5" />
            </div>
            {filtered.map((vendor) => (
              <VendorRow
                key={vendor.id}
                vendor={vendor}
                showMeta={showMeta}
                onOpenModal={(id) => setModal(id)}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>

      {/* Application modal */}
      {modalVendor && (
        <ApplicationModal
          vendor={modalVendor}
          tiers={tiers}
          showMeta={showMeta}
          onClose={() => setModal(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Email blast modal */}
      {blastOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.currentTarget === e.target) setBlastOpen(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-ps-borderLight flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-ps-accentLight flex items-center justify-center">
                  <Mail size={15} className="text-ps-accent" />
                </div>
                <h2 className="font-bold text-ps-text text-base">Email Blast</h2>
              </div>
              <button onClick={() => setBlastOpen(false)} className="text-ps-muted hover:text-ps-text transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Group selector */}
              <div>
                <p className="text-xs font-semibold text-ps-muted uppercase tracking-wide mb-2">Send to</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {([
                    { key: 'active',    label: 'All Active',        desc: 'Approved + Confirmed' },
                    { key: 'confirmed', label: 'Confirmed Only',     desc: 'Paid vendors'         },
                    { key: 'approved',  label: 'Awaiting Payment',   desc: 'Approved, not paid'   },
                    { key: 'pending',   label: 'Pending Review',     desc: 'Awaiting approval'    },
                    { key: 'all',       label: 'Everyone',           desc: 'All non-declined'     },
                  ] as const).map((g) => (
                    <button
                      key={g.key}
                      onClick={() => setBlastGroup(g.key)}
                      className={`flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-all ${
                        blastGroup === g.key
                          ? 'border-ps-accent bg-ps-accentLight ring-1 ring-ps-accent/30'
                          : 'border-ps-borderLight hover:border-ps-border bg-white'
                      }`}
                    >
                      <span className={`text-xs font-bold leading-tight ${blastGroup === g.key ? 'text-ps-accent' : 'text-ps-text'}`}>{g.label}</span>
                      <span className="text-[10px] text-ps-muted mt-0.5">{blastGroupCounts[g.key]} recipients · {g.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-ps-muted uppercase tracking-wide mb-1.5">Subject</label>
                <input
                  type="text"
                  value={blastSubject}
                  onChange={(e) => setBlastSubject(e.target.value)}
                  placeholder="Important update about the show..."
                  className="w-full border border-ps-border rounded-xl px-3 py-2.5 text-sm text-ps-text focus:outline-none focus:border-ps-accent transition-colors placeholder:text-ps-muted"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-ps-muted uppercase tracking-wide mb-1.5">Message</label>
                <textarea
                  value={blastMessage}
                  onChange={(e) => setBlastMessage(e.target.value)}
                  rows={5}
                  placeholder="Hey vendors, just a quick update..."
                  className="w-full border border-ps-border rounded-xl px-3 py-2.5 text-sm text-ps-text focus:outline-none focus:border-ps-accent transition-colors placeholder:text-ps-muted resize-none"
                />
              </div>

              {blastSent !== null && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                  <Check size={13} className="text-green-600 shrink-0" />
                  <p className="text-sm font-semibold text-green-700">Sent to {blastSent} vendor{blastSent !== 1 ? 's' : ''}!</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-ps-borderLight bg-gray-50 flex items-center gap-3">
              <p className="text-xs text-ps-muted flex-1">
                {blastGroupCounts[blastGroup]} recipient{blastGroupCounts[blastGroup] !== 1 ? 's' : ''}
              </p>
              <button
                onClick={() => setBlastOpen(false)}
                className="text-sm font-medium text-ps-muted hover:text-ps-text transition-colors px-3 py-2"
              >
                Cancel
              </button>
              <button
                onClick={sendBlast}
                disabled={blastSending || !blastSubject.trim() || !blastMessage.trim() || blastGroupCounts[blastGroup] === 0}
                className="flex items-center gap-2 bg-ps-accent hover:bg-ps-accentHover disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
              >
                {blastSending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                {blastSending ? 'Sending…' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
