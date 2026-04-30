'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Plus, MapPin, Calendar, Users, MessageSquare, ArrowRight, Settings } from 'lucide-react'

const CARD_GRADIENTS: Record<string, string> = {
  red:     'from-red-500 to-rose-600',
  navy:    'from-blue-900 to-slate-800',
  emerald: 'from-emerald-500 to-green-600',
  gold:    'from-amber-400 to-orange-500',
  slate:   'from-slate-500 to-slate-700',
  purple:  'from-violet-500 to-purple-700',
}

type HostedShow = {
  id: string; slug: string; name: string; location: string
  date: string | null; theme: string; flierUrl: string | null
  _count: { vendors: number; forumPosts: number }
  vendors: { id: string }[]
}

type Application = {
  id: string; status: string; createdAt: string; tableNumber: string | null
  show: {
    id: string; slug: string; name: string; location: string
    date: string | null; theme: string; flierUrl: string | null
    host: { name: string | null }
  }
}

type DashboardData = { hostedShows: HostedShow[]; applications: Application[] }
type View = 'shows' | 'applications'

function statusConfig(status: string) {
  switch (status) {
    case 'approved': return { label: 'Approved',      color: 'bg-green-50 text-green-700 border-green-200' }
    case 'pending':  return { label: 'Pending review', color: 'bg-amber-50 text-amber-700 border-amber-200' }
    case 'rejected': return { label: 'Not accepted',  color: 'bg-red-50 text-red-600 border-red-200' }
    case 'invited':  return { label: 'Invited',       color: 'bg-blue-50 text-blue-600 border-blue-200' }
    default:         return { label: status,           color: 'bg-ps-surface2 text-ps-secondary border-ps-border' }
  }
}

function ApplicationRow({ app }: { app: Application }) {
  const cfg = statusConfig(app.status)
  const grad = CARD_GRADIENTS[app.show.theme ?? 'red'] ?? CARD_GRADIENTS.red
  return (
    <Link href={`/shows/${app.show.slug}`} className="group block">
      <div className="bg-white border border-ps-borderLight rounded-2xl overflow-hidden hover:shadow-card transition-all duration-200 flex items-stretch">
        <div className={`w-1.5 bg-gradient-to-b ${grad} shrink-0`} />
        <div className="flex items-center gap-4 px-5 py-4 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-ps-text text-sm truncate">{app.show.name}</p>
            <div className="flex flex-wrap items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1 text-xs text-ps-secondary">
                <MapPin size={10} className="text-ps-accent shrink-0" /> {app.show.location}
              </span>
              {app.show.date && (
                <span className="flex items-center gap-1 text-xs text-ps-secondary">
                  <Calendar size={10} className="text-ps-accent shrink-0" /> {formatDate(app.show.date)}
                </span>
              )}
              <span className="text-xs text-ps-muted">
                by {app.show.host.name}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            {app.tableNumber && (
              <span className="text-xs text-ps-secondary bg-ps-surface2 border border-ps-borderLight px-2.5 py-1 rounded-lg font-mono hidden sm:block">
                Table {app.tableNumber}
              </span>
            )}
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${cfg.color}`}>
              {cfg.label}
            </span>
            <ArrowRight size={13} className="text-ps-muted opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [view, setView] = useState<View>('shows')

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d: DashboardData) => {
        setData(d)
        if (d.hostedShows.length === 0) setView('applications')
      })
  }, [user])

  if (loading || !user) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-5 h-5 border-2 border-ps-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const hostedShows = data?.hostedShows ?? []
  const applications = data?.applications ?? []
  const now = new Date()

  const pendingReceived = hostedShows.reduce((n, s) => n + s.vendors.length, 0)
  const approvedAsVendor = applications.filter((a) => a.status === 'approved').length
  const pendingAsVendor = applications.filter((a) => a.status === 'pending').length

  const upcomingApps = applications.filter((a) => !a.show.date || new Date(a.show.date) >= now)
  const pastApps = applications.filter((a) => a.show.date != null && new Date(a.show.date) < now)

  return (
    <div>

      {/* ── HEADER ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-bold text-ps-accent uppercase tracking-widest mb-1.5">Dashboard</p>
          <h1 className="text-3xl font-bold tracking-tight text-ps-text leading-tight">
            Welcome back, {user.name.split(' ')[0]}
          </h1>
        </div>
        <Link
          href="/shows/new"
          className="flex items-center gap-2 bg-ps-accent hover:bg-ps-accentHover text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-colors shrink-0 mt-1"
        >
          <Plus size={15} /> New Show
        </Link>
      </div>

      {/* ── STATS ── */}
      <div className={`grid gap-3 mb-8 ${hostedShows.length > 0 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'}`}>
        {hostedShows.length > 0 && (
          <>
            <div className="bg-white border border-ps-borderLight rounded-2xl p-5 shadow-soft">
              <p className="text-[11px] font-bold text-ps-muted uppercase tracking-widest mb-2">Shows Hosted</p>
              <p className="text-3xl font-bold text-ps-text">{hostedShows.length}</p>
            </div>
            <div className="bg-white border border-ps-borderLight rounded-2xl p-5 shadow-soft">
              <p className="text-[11px] font-bold text-ps-muted uppercase tracking-widest mb-2">Pending Apps</p>
              <p className="text-3xl font-bold text-amber-500">{pendingReceived}</p>
            </div>
          </>
        )}
        <div className="bg-white border border-ps-borderLight rounded-2xl p-5 shadow-soft">
          <p className="text-[11px] font-bold text-ps-muted uppercase tracking-widest mb-2">Shows Attending</p>
          <p className="text-3xl font-bold text-green-500">{approvedAsVendor}</p>
        </div>
        <div className="bg-white border border-ps-borderLight rounded-2xl p-5 shadow-soft">
          <p className="text-[11px] font-bold text-ps-muted uppercase tracking-widest mb-2">Awaiting Review</p>
          <p className="text-3xl font-bold text-ps-text">{pendingAsVendor}</p>
        </div>
      </div>

      {/* ── VIEW TOGGLE (only if has hosted shows) ── */}
      {hostedShows.length > 0 && (
        <div className="flex items-center gap-1 bg-white border border-ps-borderLight rounded-full p-1 shadow-soft w-fit mb-8">
          <button
            onClick={() => setView('shows')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              view === 'shows' ? 'bg-ps-text text-white shadow-sm' : 'text-ps-secondary hover:text-ps-text'
            }`}
          >
            My Shows
          </button>
          <button
            onClick={() => setView('applications')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              view === 'applications' ? 'bg-ps-text text-white shadow-sm' : 'text-ps-secondary hover:text-ps-text'
            }`}
          >
            My Applications
            {applications.length > 0 && (
              <span className="ml-2 text-[10px] font-bold bg-ps-accent text-white rounded-full px-1.5 py-0.5">
                {applications.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* ── MY SHOWS VIEW ── */}
      {view === 'shows' && (
        <>
          {hostedShows.length === 0 ? (
            <div className="bg-white border border-ps-borderLight rounded-3xl p-16 text-center shadow-card">
              <div className="text-5xl mb-4">🎪</div>
              <p className="text-ps-text font-bold text-lg mb-2">No shows hosted yet</p>
              <p className="text-ps-muted text-sm mb-6">Create your first card show and get it in front of vendors and collectors.</p>
              <Link
                href="/shows/new"
                className="inline-flex items-center gap-2 bg-ps-accent hover:bg-ps-accentHover text-white px-6 py-3 rounded-full text-sm font-semibold transition-colors"
              >
                Create a show <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {hostedShows.map((show) => {
                const grad = CARD_GRADIENTS[show.theme ?? 'red'] ?? CARD_GRADIENTS.red
                const isUpcoming = !show.date || new Date(show.date) >= now
                const pendingCount = show.vendors.length
                return (
                  <div key={show.id} className="bg-white border border-ps-borderLight rounded-3xl overflow-hidden hover:shadow-card-hover transition-all duration-300 flex flex-col">

                    {/* Gradient / flier header */}
                    <div className={`relative h-36 bg-gradient-to-br ${grad} flex flex-col justify-end p-5 overflow-hidden`}>
                      {show.flierUrl && (
                        <>
                          <img
                            src={show.flierUrl}
                            alt={show.name}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        </>
                      )}
                      <div className="relative z-10">
                        <h3 className="text-white font-bold text-base leading-tight drop-shadow-sm">{show.name}</h3>
                      </div>
                      {/* Top-right badges */}
                      <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 z-10">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-sm ${
                          isUpcoming
                            ? 'bg-green-500/25 text-green-100 border border-green-400/40'
                            : 'bg-black/30 text-white/60 border border-white/15'
                        }`}>
                          {isUpcoming ? 'Upcoming' : 'Past'}
                        </span>
                        {pendingCount > 0 && (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-900">
                            {pendingCount} pending
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="space-y-1 mb-4">
                        <div className="flex items-center gap-1.5 text-xs text-ps-secondary">
                          <MapPin size={11} className="text-ps-accent shrink-0" />
                          <span className="truncate">{show.location}</span>
                        </div>
                        {show.date ? (
                          <div className="flex items-center gap-1.5 text-xs text-ps-secondary">
                            <Calendar size={11} className="text-ps-accent shrink-0" />
                            {formatDate(show.date)}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-ps-muted italic">
                            <Calendar size={11} className="shrink-0" /> Date TBD
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 py-3 border-y border-ps-borderLight text-xs text-ps-muted mb-4">
                        <span className="flex items-center gap-1.5">
                          <Users size={11} /> {show._count.vendors} vendors
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MessageSquare size={11} /> {show._count.forumPosts} posts
                        </span>
                      </div>

                      <div className="flex gap-2 mt-auto">
                        <Link
                          href={`/shows/${show.slug}`}
                          className="flex-1 text-center text-xs font-semibold text-ps-secondary hover:text-ps-text bg-ps-surface2 hover:bg-ps-border px-3 py-2.5 rounded-xl transition-colors"
                        >
                          View
                        </Link>
                        <Link
                          href={`/shows/${show.slug}/edit`}
                          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-ps-accent hover:bg-ps-accentHover px-3 py-2.5 rounded-xl transition-colors"
                        >
                          <Settings size={11} /> Manage
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── MY APPLICATIONS VIEW ── */}
      {view === 'applications' && (
        <>
          {applications.length === 0 ? (
            <div className="bg-white border border-ps-borderLight rounded-3xl p-16 text-center shadow-card">
              <div className="text-5xl mb-4">🎴</div>
              <p className="text-ps-text font-bold text-lg mb-2">No applications yet</p>
              <p className="text-ps-muted text-sm mb-6">Apply as a vendor at an upcoming card show.</p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-ps-accent hover:bg-ps-accentHover text-white px-6 py-3 rounded-full text-sm font-semibold transition-colors"
              >
                Browse shows <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="space-y-10">
              {upcomingApps.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <p className="text-xs font-bold text-ps-muted uppercase tracking-widest">Upcoming</p>
                    <div className="flex-1 h-px bg-ps-borderLight" />
                    <span className="text-xs text-ps-muted">{upcomingApps.length} show{upcomingApps.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="space-y-2.5">
                    {upcomingApps.map((app) => (
                      <ApplicationRow key={app.id} app={app} />
                    ))}
                  </div>
                </div>
              )}

              {pastApps.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <p className="text-xs font-bold text-ps-muted uppercase tracking-widest">Past</p>
                    <div className="flex-1 h-px bg-ps-borderLight" />
                    <span className="text-xs text-ps-muted">{pastApps.length} show{pastApps.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="space-y-2.5 opacity-70">
                    {pastApps.map((app) => (
                      <ApplicationRow key={app.id} app={app} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

    </div>
  )
}
