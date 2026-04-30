import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { MapPin, Calendar, Users, MessageSquare, Settings } from 'lucide-react'
import Link from 'next/link'
import ShowActions from './ShowActions'
import ShowContent from './ShowContent'
import { getSession } from '@/lib/auth'
import { getTheme } from '@/lib/themes'

export const revalidate = 0

interface ScheduleItem { time: string; label: string }
interface FAQItem { question: string; answer: string }

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

  return (
    <div>

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
                  Card Show
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
                    Card Show
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
                Card Show
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

      {/* ── VIEW SWITCHER + CONTENT ──────────────────────────── */}
      <ShowContent
        showId={show.id}
        showSlug={show.slug}
        showHostId={show.hostId}
        showDate={show.date?.toISOString() ?? null}
        showCountdown={show.showCountdown}
        vendorMapUrl={show.vendorMapUrl}
        logistics={show.logistics}
        vendors={show.vendors}
        schedule={schedule}
        faq={faq}
        forumPostCount={show._count.forumPosts}
        isVendor={isVendor}
        userId={session?.userId}
      />

    </div>
  )
}
