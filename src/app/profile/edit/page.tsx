'use client'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import ImageUpload from '@/components/ImageUpload'
import Link from 'next/link'
import { ArrowLeft, Loader2, Check, X, Trash2, Plus, ExternalLink } from 'lucide-react'

interface InventoryItem {
  id: string; imageUrl: string; caption: string | null; createdAt: string
}

interface ProfileData {
  id: string; name: string; email: string; businessName: string | null
  bio: string | null; profileImageUrl: string | null; instagramHandle: string | null
  inventoryItems: InventoryItem[]
}

export default function ProfileEditPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [form, setForm] = useState({ name: '', businessName: '', bio: '', instagramHandle: '', profileImageUrl: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [uploadingInventory, setUploadingInventory] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    fetch('/api/profile')
      .then(r => r.json())
      .then((d: ProfileData) => {
        setProfile(d)
        setForm({
          name: d.name ?? '',
          businessName: d.businessName ?? '',
          bio: d.bio ?? '',
          instagramHandle: d.instagramHandle ?? '',
          profileImageUrl: d.profileImageUrl ?? '',
        })
      })
  }, [user])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setSaveError(''); setSaved(false)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleInventoryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingInventory(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
      const { url } = await uploadRes.json()
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url }),
      })
      const item: InventoryItem = await res.json()
      setProfile(p => p ? { ...p, inventoryItems: [item, ...p.inventoryItems] } : p)
    } finally {
      setUploadingInventory(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function deleteInventoryItem(id: string) {
    await fetch(`/api/inventory/${id}`, { method: 'DELETE' })
    setProfile(p => p ? { ...p, inventoryItems: p.inventoryItems.filter(i => i.id !== id) } : p)
  }

  const input = 'w-full bg-ps-surface2 border border-ps-border rounded-xl px-4 py-2.5 text-ps-text text-sm focus:outline-none focus:border-ps-accent focus:ring-2 focus:ring-ps-accentLight transition-all placeholder:text-ps-muted'

  if (loading || !user) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-5 h-5 border-2 border-ps-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const items = profile?.inventoryItems ?? []
  const displayName = form.businessName || form.name
  const initials = displayName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-ps-secondary hover:text-ps-text text-sm font-medium transition-colors">
          <ArrowLeft size={14} /> Dashboard
        </Link>
        {user && (
          <Link href={`/users/${user.id}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-ps-secondary hover:text-ps-accent transition-colors">
            View public profile <ExternalLink size={11} />
          </Link>
        )}
      </div>

      <div className="mb-8">
        <p className="text-xs font-bold text-ps-accent uppercase tracking-widest mb-1.5">Account</p>
        <h1 className="text-3xl font-bold tracking-tight text-ps-text">Edit Profile</h1>
      </div>

      {/* Profile info card */}
      <div className="bg-white border border-ps-borderLight rounded-3xl shadow-card overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-ps-borderLight">
          <h2 className="font-semibold text-ps-text">Profile Info</h2>
          <p className="text-xs text-ps-muted mt-0.5">Visible on your public vendor profile</p>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">

          {/* Profile picture + initials preview */}
          <div className="flex items-center gap-5">
            <div className="shrink-0">
              {form.profileImageUrl ? (
                <img src={form.profileImageUrl} alt="Profile" className="w-16 h-16 rounded-2xl object-cover border border-ps-borderLight" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-ps-accent flex items-center justify-center">
                  <span className="text-white font-black text-xl">{initials || '?'}</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <ImageUpload
                label="Profile Photo"
                currentUrl={form.profileImageUrl || null}
                onUpload={(url) => setForm(f => ({ ...f, profileImageUrl: url }))}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ps-muted uppercase tracking-wide mb-2">Full Name</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={input} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ps-muted uppercase tracking-wide mb-2">Business / Brand Name</label>
              <input type="text" value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))} className={input} placeholder="Jake's Cards" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ps-muted uppercase tracking-wide mb-2">Instagram Handle</label>
            <div className="flex items-center">
              <span className="flex items-center gap-1.5 bg-ps-surface2 border border-r-0 border-ps-border rounded-l-xl px-3 py-2.5 text-ps-muted text-sm">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg> @
              </span>
              <input
                type="text"
                value={form.instagramHandle}
                onChange={e => setForm(f => ({ ...f, instagramHandle: e.target.value.replace('@', '') }))}
                className="flex-1 bg-ps-surface2 border border-ps-border rounded-r-xl px-4 py-2.5 text-ps-text text-sm focus:outline-none focus:border-ps-accent focus:ring-2 focus:ring-ps-accentLight transition-all placeholder:text-ps-muted"
                placeholder="yourhandle"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ps-muted uppercase tracking-wide mb-2">Bio</label>
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              rows={3}
              className={input + ' resize-none'}
              placeholder="Tell other collectors and hosts about yourself and your inventory…"
            />
          </div>

          {saveError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-xs">
              <X size={13} className="shrink-0" /> {saveError}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            {saved && (
              <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                <Check size={12} /> Saved
              </span>
            )}
            <button type="submit" disabled={saving} className="ml-auto inline-flex items-center gap-2 bg-ps-accent hover:bg-ps-accentHover disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
              {saving && <Loader2 size={13} className="animate-spin" />}
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Inventory showcase card */}
      <div className="bg-white border border-ps-borderLight rounded-3xl shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-ps-borderLight">
          <h2 className="font-semibold text-ps-text">Inventory Showcase</h2>
          <p className="text-xs text-ps-muted mt-0.5">Upload cards or items you&apos;re bringing — shown on show pages and your profile. Up to 12 photos.</p>
        </div>

        <div className="p-6">
          {items.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-5">
              {items.map(item => (
                <div key={item.id} className="relative group aspect-square">
                  <img
                    src={item.imageUrl}
                    alt={item.caption ?? 'Inventory item'}
                    className="w-full h-full object-cover rounded-2xl border border-ps-borderLight"
                  />
                  <button
                    type="button"
                    onClick={() => deleteInventoryItem(item.id)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={11} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {items.length < 12 && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleInventoryUpload}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingInventory}
                className="flex items-center gap-2 text-sm font-semibold text-ps-accent hover:text-ps-accentHover disabled:opacity-50 transition-colors"
              >
                {uploadingInventory ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                {uploadingInventory ? 'Uploading…' : 'Add photo'}
              </button>
            </>
          )}

          {items.length === 0 && !uploadingInventory && (
            <p className="text-xs text-ps-muted mt-2">No photos yet. Add a PSA slab, binder, or collection photo to show attendees what you&apos;re bringing.</p>
          )}
        </div>
      </div>
    </div>
  )
}
