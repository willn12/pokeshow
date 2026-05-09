'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useParams } from 'next/navigation'
import ImageUpload from '@/components/ImageUpload'
import Link from 'next/link'
import {
  ArrowLeft, ExternalLink, MapPin, Calendar, UserPlus,
  Check, X, Loader2, FileText, Users, Palette, Map,
} from 'lucide-react'
import VendorDashboard from './VendorDashboard'
import CustomizationSection from './CustomizationSection'
import TableTierManager from './TableTierManager'
import TableMapEditor from './TableMapEditor'

interface Show {
  id: string; slug: string; name: string; location: string
  date: string | null; description: string | null
  flierUrl: string | null; hostId: string
}

type Tab = 'details' | 'applications' | 'customize' | 'map'

const NAV: { id: Tab; label: string; desc: string; Icon: React.ElementType }[] = [
  { id: 'details',      label: 'Show Details',  desc: 'Event info & table tiers',   Icon: FileText },
  { id: 'applications', label: 'Applications',  desc: 'Review & manage vendors',    Icon: Users    },
  { id: 'customize',    label: 'Customize',      desc: 'Theme & page builder',       Icon: Palette  },
  { id: 'map',          label: 'Table Map',      desc: 'Place tables & assign spots', Icon: Map     },
]

function formatShowDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

const fieldLabel = 'block text-[11px] font-bold text-ps-muted uppercase tracking-widest mb-1.5'
const fieldInput = 'w-full bg-white border border-ps-border rounded-xl px-4 py-2.5 text-ps-text text-sm focus:outline-none focus:border-ps-accent focus:ring-2 focus:ring-ps-accentLight transition-all placeholder:text-ps-muted'

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 h-px bg-ps-borderLight" />
      <span className="text-[10px] font-bold text-ps-muted uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-ps-borderLight" />
    </div>
  )
}

export default function EditShowPage() {
  const { user, loading } = useAuth()
  const params = useParams<{ slug: string }>()
  const slug = params.slug

  const [activeTab, setActiveTab]     = useState<Tab>('applications')
  const [show, setShow]               = useState<Show | null>(null)
  const [form, setForm]               = useState({
    name: '', location: '', date: '', description: '', flierUrl: '',
    ontreasureEventSlug: '', ontreasureUsername: '',
  })
  const [saving, setSaving]           = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError]     = useState('')

  const [applicationsOpen, setApplicationsOpen] = useState(true)
  const [togglingApps, setTogglingApps]         = useState(false)

  const [showInvite, setShowInvite]     = useState(false)
  const [inviteEmail, setInviteEmail]   = useState('')
  const [inviteResult, setInviteResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [inviting, setInviting]         = useState(false)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/shows/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setShow(data)
        setApplicationsOpen(data.applicationsOpen ?? true)
        setForm({
          name:                data.name                ?? '',
          location:            data.location            ?? '',
          date:                data.date ? data.date.split('T')[0] : '',
          description:         data.description         ?? '',
          flierUrl:            data.flierUrl            ?? '',
          ontreasureEventSlug: data.ontreasureEventSlug ?? '',
          ontreasureUsername:  data.ontreasureUsername  ?? '',
        })
      })
  }, [slug])

  function setField(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setSaveError(''); setSaveSuccess(false)
    try {
      const res = await fetch(`/api/shows/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setShow((s) => s ? { ...s, name: form.name, location: form.location } : s)
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
    setInviting(true); setInviteResult(null)
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

  async function handleToggleApplications() {
    const next = !applicationsOpen
    setApplicationsOpen(next)
    setTogglingApps(true)
    await fetch(`/api/shows/${slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationsOpen: next }),
    })
    setTogglingApps(false)
  }

  const activeNav = NAV.find((n) => n.id === activeTab)!

  if (loading) {
    return (
      <div className="fixed inset-0 top-14 z-40 flex items-center justify-center bg-ps-bg">
        <Loader2 size={20} className="animate-spin text-ps-muted" />
      </div>
    )
  }

  if (!user || (show && show.hostId !== user.id)) {
    return (
      <div className="fixed inset-0 top-14 z-40 flex items-center justify-center bg-ps-bg">
        <p className="text-ps-secondary text-sm">You&apos;re not authorized to manage this show.</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex bg-gray-50" style={{ top: 56 }}>

      {/* ── LEFT SIDEBAR ── */}
      <aside className="w-56 shrink-0 bg-white border-r border-ps-borderLight flex flex-col">

        <div className="px-4 py-3 border-b border-ps-borderLight">
          <Link href={`/shows/${slug}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-ps-secondary hover:text-ps-text transition-colors">
            <ArrowLeft size={13} /> Back to show
          </Link>
        </div>

        <div className="px-4 py-4 border-b border-ps-borderLight">
          <p className="text-[10px] font-bold text-ps-muted uppercase tracking-widest mb-1.5">Managing</p>
          <p className="font-bold text-ps-text text-sm leading-snug">
            {show?.name ?? <span className="text-ps-border">Loading…</span>}
          </p>
          {show && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-ps-muted">
                <MapPin size={9} className="text-ps-accent shrink-0" />
                <span className="truncate">{show.location}</span>
              </div>
              {show.date && (
                <div className="flex items-center gap-1.5 text-xs text-ps-muted">
                  <Calendar size={9} className="text-ps-accent shrink-0" />
                  <span className="truncate">{formatShowDate(show.date)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <nav className="flex-1 py-2">
          {NAV.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                activeTab === id
                  ? 'bg-ps-accentLight text-ps-accent font-semibold'
                  : 'text-ps-secondary hover:bg-gray-50 hover:text-ps-text font-medium'
              }`}
            >
              <Icon size={15} className="shrink-0" />
              <span className="text-sm">{label}</span>
            </button>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-ps-borderLight">
          <Link href={`/shows/${slug}`} className="flex items-center gap-1.5 text-xs text-ps-muted hover:text-ps-accent transition-colors">
            <ExternalLink size={11} /> View live page
          </Link>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Section header bar */}
        <div className="shrink-0 h-14 bg-white border-b border-ps-borderLight flex items-center px-6 gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-ps-text text-sm leading-tight">{activeNav.label}</h1>
            <p className="text-xs text-ps-muted leading-tight">{activeNav.desc}</p>
          </div>

          {activeTab === 'applications' && (
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${applicationsOpen ? 'text-green-600' : 'text-ps-muted'}`}>
                  {applicationsOpen ? 'Applications open' : 'Applications closed'}
                </span>
                <button
                  type="button"
                  onClick={handleToggleApplications}
                  disabled={togglingApps}
                  className={`relative w-9 h-5 rounded-full transition-colors disabled:opacity-60 shrink-0 ${applicationsOpen ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${applicationsOpen ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => { setShowInvite((v) => !v); setInviteResult(null) }}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                  showInvite ? 'bg-gray-100 border-gray-200 text-ps-secondary' : 'bg-ps-accent border-transparent text-white hover:bg-ps-accentHover'
                }`}
              >
                <UserPlus size={12} /> Invite Vendor
              </button>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="flex items-center gap-3 shrink-0">
              {saveSuccess && (
                <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <Check size={11} /> Saved
                </span>
              )}
              {saveError && (
                <span className="text-xs text-red-500 font-medium">{saveError}</span>
              )}
              <button
                type="submit"
                form="details-form"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-ps-accent hover:bg-ps-accentHover disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* Invite panel */}
        {activeTab === 'applications' && showInvite && (
          <div className="shrink-0 bg-ps-surface2 border-b border-ps-borderLight px-6 py-3 flex items-center gap-3">
            <form onSubmit={handleInvite} className="flex items-center gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="vendor@email.com"
                className="bg-white border border-ps-border rounded-lg px-3.5 py-2 text-sm text-ps-text placeholder:text-ps-muted focus:outline-none focus:border-ps-accent transition-colors w-64"
                required
              />
              <button type="submit" disabled={inviting} className="inline-flex items-center gap-1.5 bg-ps-accent hover:bg-ps-accentHover disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap">
                {inviting && <Loader2 size={12} className="animate-spin" />}
                {inviting ? 'Sending…' : 'Send Invite'}
              </button>
            </form>
            {inviteResult && (
              <span className={`text-xs flex items-center gap-1 ${inviteResult.ok ? 'text-green-600' : 'text-red-500'}`}>
                {inviteResult.ok ? <Check size={11} /> : <X size={11} />}
                {inviteResult.msg}
              </span>
            )}
            <button type="button" onClick={() => setShowInvite(false)} className="ml-auto text-ps-muted hover:text-ps-text transition-colors">
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── SECTION CONTENT ── */}

        {/* Applications */}
        {activeTab === 'applications' && (
          <div className="flex-1 overflow-hidden">
            <VendorDashboard slug={slug} />
          </div>
        )}

        {/* Details — responsive two-panel: 50/50 on desktop, stacked on mobile */}
        {activeTab === 'details' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">

            {/* Left: Event info form */}
            <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-ps-borderLight bg-white md:overflow-y-auto">
              <form id="details-form" onSubmit={handleSave}>
                <div className="px-8 py-8 space-y-6">

                  <SectionDivider label="Event Info" />

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className={fieldLabel}>Show Name</label>
                      <input type="text" value={form.name} onChange={(e) => setField('name', e.target.value)} className={fieldInput} placeholder="Going for Broke Card Show" required />
                    </div>
                    <div>
                      <label className={fieldLabel}>Location</label>
                      <input type="text" value={form.location} onChange={(e) => setField('location', e.target.value)} className={fieldInput} placeholder="City, State or Venue" required />
                    </div>
                  </div>

                  <div>
                    <label className={fieldLabel}>Date</label>
                    <input type="date" value={form.date} onChange={(e) => setField('date', e.target.value)} className={fieldInput} />
                  </div>

                  <div>
                    <label className={fieldLabel}>Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setField('description', e.target.value)}
                      rows={6}
                      className={fieldInput + ' resize-none'}
                      placeholder="Tell vendors and attendees what to expect at your show…"
                    />
                  </div>

                  <SectionDivider label="Media" />

                  <ImageUpload
                    label="Show Flier"
                    currentUrl={form.flierUrl || null}
                    onUpload={(url) => setField('flierUrl', url)}
                  />

                </div>
              </form>
            </div>

            {/* Right: Table tiers */}
            <div className="w-full md:w-1/2 bg-gray-50 md:overflow-y-auto">
              <div className="px-8 py-8">
                <div className="mb-6">
                  <h2 className="text-sm font-bold text-ps-text">Table Tiers</h2>
                  <p className="text-xs text-ps-muted mt-0.5">Define pricing and capacity for each type of table at your show.</p>
                </div>
                <TableTierManager slug={slug} />
              </div>
            </div>

          </div>
        )}

        {/* Customize */}
        {activeTab === 'customize' && (
          <div className="flex-1 overflow-hidden">
            <CustomizationSection slug={slug} />
          </div>
        )}

        {/* Table Map */}
        {activeTab === 'map' && (
          <div className="flex-1 overflow-hidden flex">
            <TableMapEditor slug={slug} />
          </div>
        )}

      </div>
    </div>
  )
}
