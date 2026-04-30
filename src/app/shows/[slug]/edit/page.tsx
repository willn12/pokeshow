'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useParams } from 'next/navigation'
import ImageUpload from '@/components/ImageUpload'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, MapPin, Calendar, UserPlus, Check, X, Loader2 } from 'lucide-react'
import VendorDashboard from './VendorDashboard'
import CustomizationSection from './CustomizationSection'

interface Show {
  id: string; slug: string; name: string; location: string
  date: string | null; description: string | null
  flierUrl: string | null; vendorMapUrl: string | null; hostId: string
}

type Tab = 'details' | 'vendors' | 'customize'

const TABS: { id: Tab; label: string; icon: string; desc: string }[] = [
  { id: 'details',   label: 'Show Details',  icon: '📋', desc: 'Event info & media' },
  { id: 'vendors',   label: 'Vendors',        icon: '👥', desc: 'Applications & roster' },
  { id: 'customize', label: 'Customize',      icon: '🎨', desc: 'Theme & content blocks' },
]

function formatShowDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function EditShowPage() {
  const { user, loading } = useAuth()
  const params = useParams<{ slug: string }>()
  const slug = params.slug

  const [activeTab, setActiveTab] = useState<Tab>('details')
  const [show, setShow] = useState<Show | null>(null)
  const [form, setForm] = useState({
    name: '', location: '', date: '', description: '', flierUrl: '', vendorMapUrl: '',
  })
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteResult, setInviteResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/shows/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setShow(data)
        setForm({
          name: data.name ?? '',
          location: data.location ?? '',
          date: data.date ? data.date.split('T')[0] : '',
          description: data.description ?? '',
          flierUrl: data.flierUrl ?? '',
          vendorMapUrl: data.vendorMapUrl ?? '',
        })
      })
  }, [slug])

  function setField(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveError('')
    setSaveSuccess(false)
    try {
      const res = await fetch(`/api/shows/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setInviteResult(null)
    try {
      const res = await fetch(`/api/shows/${slug}/vendors`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      })
      const data = await res.json()
      if (res.ok) {
        setInviteResult({ ok: true, msg: `Invite sent! Token: ${data.inviteToken}` })
        setInviteEmail('')
      } else {
        setInviteResult({ ok: false, msg: data.error })
      }
    } finally {
      setInviting(false)
    }
  }

  const input = 'w-full bg-ps-surface2 border border-ps-border rounded-xl px-4 py-2.5 text-ps-text text-sm focus:outline-none focus:border-ps-accent focus:ring-2 focus:ring-ps-accentLight transition-all placeholder:text-ps-muted'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 size={20} className="animate-spin text-ps-muted" />
      </div>
    )
  }

  if (!user || (show && show.hostId !== user.id)) {
    return (
      <div className="text-center py-24">
        <p className="text-ps-secondary text-sm">You're not authorized to manage this show.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">

      {/* ── TOP NAV ── */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href={`/shows/${slug}`}
          className="inline-flex items-center gap-1.5 text-ps-secondary hover:text-ps-text text-sm font-medium transition-colors"
        >
          <ArrowLeft size={14} /> Back to show
        </Link>
        <Link
          href={`/shows/${slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ps-secondary hover:text-ps-accent transition-colors"
        >
          View live <ExternalLink size={11} />
        </Link>
      </div>

      {/* ── PAGE HEADER ── */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-ps-muted uppercase tracking-widest mb-1.5">Managing</p>
        <h1 className="text-3xl font-bold tracking-tight text-ps-text leading-tight">
          {show?.name ?? <span className="text-ps-border">Loading…</span>}
        </h1>
        {show && (
          <div className="flex flex-wrap gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-xs text-ps-secondary">
              <MapPin size={11} className="text-ps-accent" /> {show.location}
            </span>
            {show.date && (
              <span className="flex items-center gap-1.5 text-xs text-ps-secondary">
                <Calendar size={11} className="text-ps-accent" /> {formatShowDate(show.date)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── TAB SWITCHER ── */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-2 py-5 px-3 rounded-2xl border-2 transition-all text-center ${
              activeTab === tab.id
                ? 'border-ps-accent bg-white shadow-card'
                : 'border-ps-borderLight bg-white hover:border-ps-border hover:shadow-soft'
            }`}
          >
            <span className="text-2xl">{tab.icon}</span>
            <div>
              <div className={`text-sm font-bold leading-tight ${activeTab === tab.id ? 'text-ps-accent' : 'text-ps-text'}`}>
                {tab.label}
              </div>
              <div className="text-xs text-ps-muted mt-0.5 hidden sm:block">{tab.desc}</div>
            </div>
            {activeTab === tab.id && (
              <div className="w-6 h-1 bg-ps-accent rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}

      {/* DETAILS TAB */}
      {activeTab === 'details' && (
        <div className="bg-white border border-ps-borderLight rounded-3xl shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-ps-borderLight">
            <h2 className="font-semibold text-ps-text">Show Details</h2>
            <p className="text-xs text-ps-muted mt-0.5">Event info and media visible to attendees</p>
          </div>
          <form onSubmit={handleSave} className="p-6 space-y-5">
            {saveError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-xs">
                <X size={13} className="shrink-0" /> {saveError}
              </div>
            )}
            {saveSuccess && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-600 rounded-xl px-4 py-3 text-xs">
                <Check size={13} className="shrink-0" /> Changes saved successfully.
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ps-muted uppercase tracking-wide mb-2">Show Name</label>
                <input type="text" value={form.name} onChange={(e) => setField('name', e.target.value)} className={input} placeholder="e.g. Going for Broke Card Show" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ps-muted uppercase tracking-wide mb-2">Location</label>
                <input type="text" value={form.location} onChange={(e) => setField('location', e.target.value)} className={input} placeholder="City, Venue" required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ps-muted uppercase tracking-wide mb-2">Date</label>
              <input type="date" value={form.date} onChange={(e) => setField('date', e.target.value)} className={input + ' max-w-xs'} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ps-muted uppercase tracking-wide mb-2">Description</label>
              <textarea value={form.description} onChange={(e) => setField('description', e.target.value)} rows={4} className={input + ' resize-none'} placeholder="Tell vendors and attendees what to expect…" />
            </div>

            <div className="border-t border-ps-borderLight pt-5">
              <p className="text-xs font-semibold text-ps-muted uppercase tracking-wide mb-4">Media</p>
              <div className="grid sm:grid-cols-2 gap-5">
                <ImageUpload label="Show Flier" currentUrl={form.flierUrl} onUpload={(url) => setField('flierUrl', url)} />
                <ImageUpload label="Vendor Map" currentUrl={form.vendorMapUrl} onUpload={(url) => setField('vendorMapUrl', url)} />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-ps-accent hover:bg-ps-accentHover disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm">
                {saving && <Loader2 size={13} className="animate-spin" />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VENDORS TAB */}
      {activeTab === 'vendors' && (
        <div className="bg-white border border-ps-borderLight rounded-3xl shadow-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-ps-borderLight">
            <div>
              <h2 className="font-semibold text-ps-text">Vendor Applications</h2>
              <p className="text-xs text-ps-muted mt-0.5">Review applicants and manage your roster</p>
            </div>
            <button
              type="button"
              onClick={() => { setShowInvite((v) => !v); setInviteResult(null) }}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all shrink-0 ${
                showInvite
                  ? 'bg-ps-surface2 border-ps-border text-ps-secondary'
                  : 'bg-ps-accent border-transparent text-white hover:bg-ps-accentHover'
              }`}
            >
              <UserPlus size={13} />
              <span className="hidden sm:inline">Invite Vendor</span>
            </button>
          </div>

          {showInvite && (
            <div className="px-6 py-4 bg-ps-surface2 border-b border-ps-borderLight">
              <p className="text-xs font-semibold text-ps-text mb-3">Invite a vendor by email</p>
              <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="vendor@email.com"
                  className="flex-1 bg-white border border-ps-border rounded-xl px-4 py-2.5 text-ps-text text-sm focus:outline-none focus:border-ps-accent focus:ring-2 focus:ring-ps-accentLight transition-all placeholder:text-ps-muted"
                  required
                />
                <button type="submit" disabled={inviting} className="inline-flex items-center justify-center gap-1.5 bg-ps-accent hover:bg-ps-accentHover disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap">
                  {inviting && <Loader2 size={12} className="animate-spin" />}
                  {inviting ? 'Sending…' : 'Send Invite'}
                </button>
              </form>
              {inviteResult && (
                <p className={`text-xs mt-2.5 flex items-center gap-1.5 ${inviteResult.ok ? 'text-green-600' : 'text-red-500'}`}>
                  {inviteResult.ok ? <Check size={11} /> : <X size={11} />}
                  {inviteResult.msg}
                </p>
              )}
            </div>
          )}

          <div className="p-6">
            <VendorDashboard slug={slug} />
          </div>
        </div>
      )}

      {/* CUSTOMIZE TAB */}
      {activeTab === 'customize' && (
        <div className="bg-white border border-ps-borderLight rounded-3xl shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-ps-borderLight">
            <h2 className="font-semibold text-ps-text">Customization</h2>
            <p className="text-xs text-ps-muted mt-0.5">Theme, banner, countdown, announcements, schedule &amp; more</p>
          </div>
          <div className="p-6">
            <CustomizationSection slug={slug} />
          </div>
        </div>
      )}

    </div>
  )
}
