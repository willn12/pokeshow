'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Check, Loader2, GripVertical } from 'lucide-react'

interface Tier {
  id: string
  name: string
  description: string | null
  price: number
  quantity: number
  color: string
  sortOrder: number
  _count: { vendors: number }
}

const COLORS = [
  { value: 'gold',   label: 'Gold',   dot: 'bg-amber-400',  ring: 'ring-amber-400' },
  { value: 'blue',   label: 'Blue',   dot: 'bg-blue-500',   ring: 'ring-blue-500' },
  { value: 'green',  label: 'Green',  dot: 'bg-green-500',  ring: 'ring-green-500' },
  { value: 'purple', label: 'Purple', dot: 'bg-purple-500', ring: 'ring-purple-500' },
  { value: 'red',    label: 'Red',    dot: 'bg-red-500',    ring: 'ring-red-500' },
  { value: 'gray',   label: 'Gray',   dot: 'bg-gray-400',   ring: 'ring-gray-400' },
]

export const TIER_COLOR_MAP: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  gold:   { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  dot: 'bg-amber-400' },
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  green:  { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  dot: 'bg-green-500' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500' },
  red:    { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    dot: 'bg-red-500' },
  gray:   { bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-600',   dot: 'bg-gray-400' },
}

function TierBadge({ tier }: { tier: Pick<Tier, 'name' | 'color'> }) {
  const c = TIER_COLOR_MAP[tier.color] ?? TIER_COLOR_MAP.gray
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${c.bg} ${c.border} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {tier.name}
    </span>
  )
}

interface TierFormState {
  name: string
  description: string
  price: string
  quantity: string
  color: string
}

const emptyForm: TierFormState = { name: '', description: '', price: '', quantity: '', color: 'gray' }

function TierForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: TierFormState
  onSave: (data: TierFormState) => void
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm] = useState(initial)
  const input = 'w-full bg-ps-surface2 border border-ps-border rounded-xl px-4 py-2.5 text-ps-text text-sm focus:outline-none focus:border-ps-accent focus:ring-2 focus:ring-ps-accentLight transition-all placeholder:text-ps-muted'

  return (
    <div className="space-y-4 p-5 bg-ps-surface2 border border-ps-borderLight rounded-2xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-ps-muted uppercase tracking-wide mb-1.5">Tier Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Sponsor Table"
            className={input}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ps-muted uppercase tracking-wide mb-1.5">Color</label>
          <div className="flex gap-2 pt-1">
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, color: c.value }))}
                title={c.label}
                className={`w-7 h-7 rounded-full ${c.dot} transition-all ${form.color === c.value ? `ring-2 ring-offset-2 ${c.ring}` : 'opacity-50 hover:opacity-80'}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-ps-muted uppercase tracking-wide mb-1.5">Description <span className="font-normal normal-case text-ps-muted">(optional)</span></label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="e.g. 10×10 corner booth with premium placement"
          className={input}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-ps-muted uppercase tracking-wide mb-1.5">Price ($)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ps-muted text-sm">$</span>
            <input
              type="number"
              min="0"
              step="1"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="0"
              className={input + ' pl-7'}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-ps-muted uppercase tracking-wide mb-1.5">Quantity (tables)</label>
          <input
            type="number"
            min="0"
            step="1"
            value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            placeholder="0 = unlimited"
            className={input}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={saving || !form.name.trim()}
          className="inline-flex items-center gap-2 bg-ps-accent hover:bg-ps-accentHover disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          {saving ? 'Saving…' : 'Save Tier'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-ps-muted hover:text-ps-secondary transition-colors px-3 py-2"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function TableTierManager({ slug }: { slug: string }) {
  const [tiers, setTiers] = useState<Tier[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/shows/${slug}/tiers`)
      if (res.ok) {
        const data = await res.json()
        setTiers(data.tiers ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { load() }, [load])

  async function handleCreate(form: TierFormState) {
    setSaving(true)
    try {
      const res = await fetch(`/api/shows/${slug}/tiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          price: Number(form.price) || 0,
          quantity: Number(form.quantity) || 0,
          color: form.color,
        }),
      })
      if (res.ok) {
        await load()
        setAdding(false)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(tierId: string, form: TierFormState) {
    setSaving(true)
    try {
      const res = await fetch(`/api/shows/${slug}/tiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          tierId,
          name: form.name.trim(),
          description: form.description.trim() || null,
          price: Number(form.price) || 0,
          quantity: Number(form.quantity) || 0,
          color: form.color,
        }),
      })
      if (res.ok) {
        await load()
        setEditingId(null)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(tierId: string, vendorCount: number) {
    if (vendorCount > 0 && !confirm(`This tier has ${vendorCount} approved vendor${vendorCount !== 1 ? 's' : ''}. Deleting it will unassign them. Continue?`)) return
    await fetch(`/api/shows/${slug}/tiers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', tierId }),
    })
    setTiers((prev) => prev.filter((t) => t.id !== tierId))
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="border border-ps-borderLight rounded-2xl h-20 bg-ps-surface2 animate-pulse" />
        ))}
      </div>
    )
  }

  const totalCapacity = tiers.reduce((s, t) => s + t.quantity, 0)
  const totalFilled = tiers.reduce((s, t) => s + t._count.vendors, 0)
  const potentialRevenue = tiers.reduce((s, t) => s + t.price * t.quantity, 0)
  const confirmedRevenue = tiers.reduce((s, t) => s + t.price * t._count.vendors, 0)

  return (
    <div className="space-y-5">

      {/* Revenue summary */}
      {tiers.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Potential Revenue', value: `$${potentialRevenue.toLocaleString()}`, sub: 'if all tables sold', color: 'text-ps-text' },
            { label: 'Confirmed Revenue', value: `$${confirmedRevenue.toLocaleString()}`, sub: 'approved vendors', color: 'text-green-600' },
            { label: 'Tables Filled', value: totalCapacity > 0 ? `${totalFilled}/${totalCapacity}` : `${totalFilled}`, sub: totalCapacity > 0 ? `${Math.round((totalFilled / totalCapacity) * 100)}% fill rate` : 'no limit set', color: 'text-ps-accent' },
            { label: 'Tiers', value: tiers.length, sub: 'table categories', color: 'text-ps-text' },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-ps-borderLight rounded-2xl px-4 py-3 text-center">
              <div className={`text-xl font-bold tracking-tight ${s.color}`}>{s.value}</div>
              <div className="text-xs font-semibold text-ps-text mt-0.5">{s.label}</div>
              <div className="text-xs text-ps-muted">{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tier list */}
      <div className="space-y-2">
        {tiers.map((tier) => {
          const c = TIER_COLOR_MAP[tier.color] ?? TIER_COLOR_MAP.gray
          const isEditing = editingId === tier.id
          const fillRate = tier.quantity > 0 ? Math.round((tier._count.vendors / tier.quantity) * 100) : null

          if (isEditing) {
            return (
              <TierForm
                key={tier.id}
                initial={{
                  name: tier.name,
                  description: tier.description ?? '',
                  price: String(tier.price),
                  quantity: String(tier.quantity),
                  color: tier.color,
                }}
                onSave={(form) => handleUpdate(tier.id, form)}
                onCancel={() => setEditingId(null)}
                saving={saving}
              />
            )
          }

          return (
            <div key={tier.id} className={`flex items-center gap-4 p-4 rounded-2xl border ${c.bg} ${c.border}`}>
              <GripVertical size={14} className="text-ps-muted shrink-0 cursor-grab" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <TierBadge tier={tier} />
                  {tier.description && (
                    <span className="text-xs text-ps-muted truncate">{tier.description}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                  <span className={`text-xs font-bold ${c.text}`}>
                    {tier.price > 0 ? `$${tier.price.toLocaleString()}` : 'Free'}
                  </span>
                  <span className="text-xs text-ps-muted">
                    {tier.quantity > 0 ? `${tier._count.vendors}/${tier.quantity} tables` : `${tier._count.vendors} approved`}
                  </span>
                  {fillRate !== null && (
                    <span className={`text-xs font-semibold ${fillRate >= 80 ? 'text-green-600' : fillRate >= 50 ? 'text-amber-600' : 'text-ps-muted'}`}>
                      {fillRate}% full
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setEditingId(tier.id)}
                  className="p-2 rounded-xl text-ps-muted hover:text-ps-text hover:bg-white/60 transition-all"
                  title="Edit tier"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => handleDelete(tier.id, tier._count.vendors)}
                  className="p-2 rounded-xl text-ps-muted hover:text-red-500 hover:bg-white/60 transition-all"
                  title="Delete tier"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add form or button */}
      {adding ? (
        <TierForm
          initial={emptyForm}
          onSave={handleCreate}
          onCancel={() => setAdding(false)}
          saving={saving}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-ps-borderLight rounded-2xl py-4 text-sm font-semibold text-ps-muted hover:text-ps-text hover:border-ps-border transition-all"
        >
          <Plus size={15} />
          Add Table Tier
        </button>
      )}

      {tiers.length === 0 && !adding && (
        <div className="text-center py-4">
          <p className="text-xs text-ps-muted">
            Create tiers like <span className="font-semibold">Sponsor</span>, <span className="font-semibold">Prime Location</span>, and <span className="font-semibold">Regular</span> with different prices and quantities.
          </p>
        </div>
      )}
    </div>
  )
}
