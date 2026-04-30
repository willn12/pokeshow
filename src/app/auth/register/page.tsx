'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', name: '', businessName: '', bio: '' })
  const [isVendor, setIsVendor] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register({
        email: form.email,
        password: form.password,
        name: form.name,
        businessName: isVendor ? form.businessName : undefined,
        bio: form.bio || undefined,
      })
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full bg-ps-surface2 border border-ps-border rounded-xl px-4 py-2.5 text-ps-text text-sm focus:outline-none focus:border-ps-accent focus:ring-2 focus:ring-ps-accentLight transition-all'

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Create an account</h1>
        <p className="text-ps-secondary text-sm">Join the Card Show Central community</p>
      </div>

      <div className="bg-white rounded-3xl border border-ps-borderLight shadow-card p-8">
        {/* Account type toggle */}
        <div className="flex gap-2 p-1 bg-ps-surface2 rounded-xl mb-6">
          <button
            onClick={() => setIsVendor(false)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${!isVendor ? 'bg-white shadow-soft text-ps-text' : 'text-ps-secondary hover:text-ps-text'}`}
          >
            Attendee / Host
          </button>
          <button
            onClick={() => setIsVendor(true)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${isVendor ? 'bg-white shadow-soft text-ps-text' : 'text-ps-secondary hover:text-ps-text'}`}
          >
            Vendor
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 mb-5 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ps-text mb-1.5">Name</label>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-ps-text mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-ps-text mb-1.5">Password</label>
            <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} className={inputClass} required minLength={6} />
          </div>
          {isVendor && (
            <div>
              <label className="block text-sm font-medium text-ps-text mb-1.5">Business Name</label>
              <input type="text" value={form.businessName} onChange={(e) => set('businessName', e.target.value)} placeholder="e.g. Rare Cards Co." className={inputClass} />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-ps-text mb-1.5">
              Bio <span className="text-ps-muted font-normal">(optional)</span>
            </label>
            <textarea value={form.bio} onChange={(e) => set('bio', e.target.value)} rows={2} className={inputClass + ' resize-none'} />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ps-accent hover:bg-ps-accentHover disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm mt-2"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-ps-secondary mt-6">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-ps-accent hover:text-ps-accentHover font-medium">Sign in</Link>
      </p>
    </div>
  )
}
