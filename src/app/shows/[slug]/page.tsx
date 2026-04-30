import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { MapPin, Calendar, Users, MessageSquare, Clock, Info, Settings } from 'lucide-react'
import Link from 'next/link'
import ShowActions from './ShowActions'
import Forum from '@/components/Forum'
import Countdown from '@/components/Countdown'
import ShowFAQ from '@/components/ShowFAQ'
import ShowNav from '@/components/ShowNav'
import { getSession } from '@/lib/auth'
import { getTheme } from '@/lib/themes'

export const revalidate = 0

interface ScheduleItem { time: string; label: string }
interface FAQItem { question: string; answer: string }

const AVATAR_COLORS = [
  'bg-red-100 text-red-600',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-violet-100 text-violet-700',
  'bg-pink-100 text-pink-700',
]

function avatarColor(name: string) {
  const i = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[i]
}

export default async function ShowPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getSession()

  const show = await prisma.show.findUnique({
    where: { slug },
    include: {
      host: { select: { id: true, name: true } },
      vendors: {
        where: { status: 'approved' },
        include: { user: { select: { id: true, name: true, businessName: true, bio: true } } },
        orderBy: { tableNumber: 'asc' },
      },
      _count: { select: { forumPosts: true, vendors: true } },
    },
  })

  if (!show) notFound()

  const isHost = session?.userId === show.hostId

  let isVendor = false
  let applicationStatus: string | null = null
  if (session) {
    const vendorRecord = await prisma.showVendor.findUnique({
      where: { showId_userId: { showId: show.id, userId: session.userId } },
    })
    isVendor = vendorRecord?.status === 'approved'
    applicationStatus = vendorRecord?.status ?? null
  }

  const theme = getTheme(show.theme)
  const schedule = (show.schedule as ScheduleItem[] | null) ?? []
  const faq = (show.faq as FAQItem[] | null) ?? []

  const navSections = [
    { id: 'forum', label: 'Community' },
    { id: 'vendors', label: 'Vendors' },
    ...(schedule.length > 0 ? [{ id: 'schedule', label: 'Schedule' }] : []),
    ...(show.logistics ? [{ id: 'logistics', label: 'Info' }] : []),
    ...(faq.length > 0 ? [{ id: 'faq', label: 'FAQ' }] : []),
  ]

  return (
    <div>

      {/* ── SECTION NAV (top, sticky) ────────────────────────── */}
      <ShowNav sections={navSections} />

      {/* ── ANNOUNCEMENT BANNER ─────────────────────────────── */}
      {show.announcementBanner && (
        <div className="mb-5 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <span className="text-amber-400 text-base shrink-0 mt-px">📢</span>
          <p className="text-sm text-amber-900 font-medium leading-relaxed">{show.announcementBanner}</p>
        </div>
      )}

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="mb-5">
        <div className={`rounded-3xl overflow-hidden ${!show.bannerUrl && !show.flierUrl ? `bg-gradient-to-br ${theme.gradient} border border-ps-borderLight` : ''}`}>

          {show.bannerUrl ? (
            <div className="relative">
              <img src={show.bannerUrl} alt={show.name} className="w-full h-56 sm:h-72 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/10" />
              <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
                <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white/90 text-xs font-semibold px-3 py-1 rounded-full mb-3 w-fit tracking-wide uppercase">
                  Pokemon Card Show
                </div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3 leading-tight text-white">{show.name}</h1>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm text-white/90">
                    <MapPin size={12} /> {show.location}
                  </span>
                  {show.date && (
                    <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm text-white/90">
                      <Calendar size={12} /> {formatDate(show.date)}
                    </span>
                  )}
                </div>
                {show.description && (
                  <p className="text-white/70 text-sm leading-relaxed max-w-xl mb-5">{show.description}</p>
                )}
                <ShowActions show={show} isHost={isHost} isVendor={isVendor} userId={session?.userId} applicationStatus={applicationStatus} />
              </div>
              {show.flierUrl && (
                <div className="absolute top-6 right-8 w-28 md:w-36 hidden sm:block">
                  <img src={show.flierUrl} alt={show.name} className="w-full rounded-xl shadow-2xl rotate-1 border-2 border-white/20" />
                </div>
              )}
            </div>

          ) : show.flierUrl ? (
            <div className="relative">
              <div className="absolute inset-0 bg-cover bg-center scale-105" style={{ backgroundImage: `url(${show.flierUrl})`, filter: 'blur(24px) brightness(0.3)' }} />
              <div className="relative flex flex-col md:flex-row items-center gap-8 p-8 md:p-12">
                <div className="flex-1 text-white">
                  <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white/90 text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-wide uppercase">
                    Pokemon Card Show
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight">{show.name}</h1>
                  <div className="flex flex-wrap gap-3 mb-5">
                    <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm text-white/90">
                      <MapPin size={13} /> {show.location}
                    </span>
                    {show.date && (
                      <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm text-white/90">
                        <Calendar size={13} /> {formatDate(show.date)}
                      </span>
                    )}
                  </div>
                  {show.description && (
                    <p className="text-white/75 text-sm leading-relaxed max-w-lg mb-6">{show.description}</p>
                  )}
                  <ShowActions show={show} isHost={isHost} isVendor={isVendor} userId={session?.userId} applicationStatus={applicationStatus} />
                </div>
                <div className="shrink-0 w-full md:w-56">
                  <img src={show.flierUrl} alt={show.name} className="w-full rounded-2xl shadow-2xl rotate-1 border-2 border-white/20" />
                </div>
              </div>
            </div>

          ) : (
            <div className="p-8 md:p-12">
              <div className={`inline-flex items-center gap-1.5 ${theme.badgeClass} border text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-wide uppercase`}>
                Pokemon Card Show
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight text-ps-text">{show.name}</h1>
              <div className="flex flex-wrap gap-3 mb-5">
                <span className="flex items-center gap-1.5 bg-white border border-ps-borderLight rounded-full px-3 py-1.5 text-sm text-ps-secondary shadow-soft">
                  <MapPin size={13} className="text-ps-accent" /> {show.location}
                </span>
                {show.date && (
                  <span className="flex items-center gap-1.5 bg-white border border-ps-borderLight rounded-full px-3 py-1.5 text-sm text-ps-secondary shadow-soft">
                    <Calendar size={13} className="text-ps-accent" /> {formatDate(show.date)}
                  </span>
                )}
              </div>
              {show.description && (
                <p className="text-ps-secondary text-sm leading-relaxed max-w-2xl mb-6">{show.description}</p>
              )}
              <ShowActions show={show} isHost={isHost} isVendor={isVendor} userId={session?.userId} applicationStatus={applicationStatus} />
            </div>
          )}
        </div>

        {/* ── METADATA STRIP ── */}
        <div className="flex items-center gap-5 mt-3 px-1 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm">
            <Users size={13} className="text-ps-accent" />
            <span className="font-bold text-ps-text">{show._count.vendors}</span>
            <span className="text-ps-muted text-xs">vendors</span>
          </div>
          <div className="w-px h-3.5 bg-ps-borderLight" />
          <div className="flex items-center gap-1.5 text-sm">
            <MessageSquare size={13} className="text-ps-accent" />
            <span className="font-bold text-ps-text">{show._count.forumPosts}</span>
            <span className="text-ps-muted text-xs">posts</span>
          </div>
          <div className="w-px h-3.5 bg-ps-borderLight" />
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-ps-accent text-white text-xs flex items-center justify-center font-bold shrink-0">
              {show.host.name[0]}
            </div>
            <span className="text-xs text-ps-muted">Hosted by</span>
            <span className="text-sm font-semibold text-ps-text">{show.host.name}</span>
          </div>
        </div>

        {/* ── MANAGE SHOW BUTTON ── */}
        {isHost && (
          <div className="mt-4">
            <Link
              href={`/shows/${show.slug}/edit`}
              className="inline-flex items-center gap-2 bg-white border border-ps-borderLight text-ps-secondary hover:text-ps-text hover:border-ps-border hover:shadow-card text-xs font-semibold px-4 py-2.5 rounded-xl shadow-soft transition-all"
            >
              <Settings size={13} />
              Manage Show
            </Link>
          </div>
        )}
      </section>

      {/* ── COUNTDOWN ───────────────────────────────────────── */}
      {show.showCountdown && show.date && (
        <Countdown targetDate={show.date.toISOString()} />
      )}

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <div className="grid md:grid-cols-5 gap-8">

        {/* LEFT — Community Board */}
        <div id="forum" className="md:col-span-3">
          <Forum
            showSlug={show.slug}
            showId={show.id}
            showHostId={show.hostId}
            isVendor={isVendor}
            currentUserId={session?.userId}
            preview={true}
          />
        </div>

        {/* RIGHT — Vendors */}
        <div id="vendors" className="md:col-span-2 space-y-4">

          {/* Section header */}
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-ps-text flex items-center gap-2">
              <span className="w-1 h-5 bg-ps-accent rounded-full inline-block" />
              Vendors
              {show.vendors.length > 0 && (
                <span className="text-xs font-normal text-ps-muted ml-0.5">{show.vendors.length} confirmed</span>
              )}
            </h2>
          </div>

          {/* Vendor cards */}
          {show.vendors.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ps-border bg-white/60 p-8 text-center">
              <div className="text-2xl mb-2">🛒</div>
              <p className="text-sm text-ps-secondary font-medium">No vendors confirmed yet</p>
              <p className="text-xs text-ps-muted mt-1">Check back closer to the show date.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {show.vendors.map((v) => {
                const displayName = v.user.businessName || v.user.name
                return (
                  <div key={v.id} className="bg-white border border-ps-borderLight rounded-2xl p-4 shadow-soft flex items-start gap-3 hover:shadow-card transition-shadow">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${avatarColor(displayName)}`}>
                      {displayName[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-semibold text-sm text-ps-text truncate">{displayName}</span>
                        {v.tableNumber && (
                          <span className="text-xs bg-ps-accent text-white font-bold px-2 py-0.5 rounded-full shrink-0">
                            T{v.tableNumber}
                          </span>
                        )}
                      </div>
                      {v.user.bio && (
                        <p className="text-xs text-ps-secondary leading-relaxed line-clamp-2">{v.user.bio}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Vendor map */}
          {show.vendorMapUrl && (
            <div>
              <h3 className="font-bold text-ps-text flex items-center gap-2 mb-3 mt-2">
                <span className="w-1 h-5 bg-ps-accent rounded-full inline-block" />
                Vendor Map
              </h3>
              <div className="bg-white border border-ps-borderLight rounded-2xl overflow-hidden shadow-soft">
                <img src={show.vendorMapUrl} alt="Vendor Map" className="w-full" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── SCHEDULE ────────────────────────────────────────── */}
      {schedule.length > 0 && (
        <div id="schedule" className="mt-10">
          <h2 className="font-bold text-ps-text flex items-center gap-2 mb-6">
            <span className="w-1 h-5 bg-ps-accent rounded-full inline-block" />
            <Clock size={15} className="text-ps-accent" />
            Schedule
          </h2>
          <div className="bg-white border border-ps-borderLight rounded-3xl shadow-card overflow-hidden">
            <div className="relative p-6">
              <div className="absolute left-[30px] top-8 bottom-8 w-px bg-ps-borderLight" />
              {schedule.map((item, i) => (
                <div key={i} className={`flex items-start gap-5 relative ${i < schedule.length - 1 ? 'pb-5' : ''}`}>
                  <div className="w-4 h-4 rounded-full bg-white border-2 border-ps-accent shadow-soft shrink-0 mt-0.5 relative z-10" />
                  <div className="flex items-baseline gap-4 flex-1">
                    <span className="text-xs font-bold text-ps-accent w-16 shrink-0">{item.time}</span>
                    <span className="text-sm text-ps-text">{item.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── LOGISTICS ───────────────────────────────────────── */}
      {show.logistics && (
        <div id="logistics" className="mt-8">
          <h2 className="font-bold text-ps-text flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-ps-accent rounded-full inline-block" />
            <Info size={15} className="text-ps-accent" />
            Logistics & Info
          </h2>
          <div className="bg-white border border-ps-borderLight rounded-3xl shadow-card px-6 py-5">
            <p className="text-sm text-ps-secondary leading-relaxed whitespace-pre-line">{show.logistics}</p>
          </div>
        </div>
      )}

      {/* ── FAQ ─────────────────────────────────────────────── */}
      {faq.length > 0 && (
        <div id="faq" className="mt-8 mb-4">
          <h2 className="font-bold text-ps-text flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-ps-accent rounded-full inline-block" />
            Frequently Asked Questions
          </h2>
          <ShowFAQ items={faq} />
        </div>
      )}

    </div>
  )
}
