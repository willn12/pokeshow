'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Plus, Settings, ArrowRight } from 'lucide-react'

interface Show {
  id: string; slug: string; name: string; location: string
  date: string | null; hostId: string
  _count: { vendors: number; forumPosts: number }
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [shows, setShows] = useState<Show[]>([])

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    fetch('/api/shows')
      .then((r) => r.json())
      .then((all: Show[]) => setShows(all.filter((s) => s.hostId === user.id)))
  }, [user])

  if (loading) return <div className="text-center py-20 text-ps-secondary">Loading…</div>
  if (!user) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-ps-secondary mt-1 text-sm">Welcome back, {user.name}</p>
        </div>
        <Link href="/shows/new"
          className="flex items-center gap-2 bg-ps-accent hover:bg-ps-accentHover text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
          <Plus size={15} /> New Show
        </Link>
      </div>

      {/* Hosted shows */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold tracking-tight mb-4">Your Shows</h2>
        {shows.length === 0 ? (
          <div className="bg-white border border-ps-borderLight rounded-3xl p-12 text-center shadow-card">
            <div className="text-4xl mb-3">🎪</div>
            <p className="text-ps-secondary font-medium mb-1">No shows hosted yet</p>
            <p className="text-ps-muted text-sm mb-5">Create your first Pokemon card show to get started.</p>
            <Link href="/shows/new"
              className="inline-flex items-center gap-2 bg-ps-accent hover:bg-ps-accentHover text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors">
              Create a show <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {shows.map((show) => (
              <div key={show.id} className="bg-white border border-ps-borderLight rounded-3xl p-5 shadow-card flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-ps-text">{show.name}</h3>
                  <p className="text-sm text-ps-secondary mt-0.5">{show.location}</p>
                  {show.date && <p className="text-xs text-ps-muted mt-0.5">{formatDate(show.date)}</p>}
                  <div className="flex gap-3 mt-2 text-xs text-ps-muted">
                    <span>{show._count?.vendors ?? 0} vendors</span>
                    <span>{show._count?.forumPosts ?? 0} posts</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <Link href={`/shows/${show.slug}`}
                    className="text-xs bg-ps-surface2 hover:bg-ps-border text-ps-text px-3 py-1.5 rounded-lg transition-colors text-center font-medium">
                    View
                  </Link>
                  <Link href={`/shows/${show.slug}/edit`}
                    className="text-xs bg-ps-surface2 hover:bg-ps-border text-ps-text px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 font-medium">
                    <Settings size={11} /> Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Vendor profile */}
      {user.businessName && (
        <section>
          <h2 className="text-lg font-semibold tracking-tight mb-4">Vendor Profile</h2>
          <div className="bg-white border border-ps-borderLight rounded-3xl p-6 shadow-card">
            <div className="font-semibold text-lg text-ps-text">{user.businessName}</div>
            {user.bio && <p className="text-ps-secondary text-sm mt-1">{user.bio}</p>}
            <Link href="/"
              className="inline-flex items-center gap-1.5 text-sm text-ps-accent hover:text-ps-accentHover mt-3 font-medium transition-colors">
              Browse shows to apply <ArrowRight size={13} />
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
