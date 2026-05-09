'use client'
import { useState, useEffect } from 'react'
import Forum from '@/components/Forum'
import ShowFAQ from '@/components/ShowFAQ'
import { Clock, Info, MessageSquare, ClipboardList, Users, MapPin } from 'lucide-react'
import ContentBlocks from './ContentBlocks'

type ScheduleItem = { time: string; label: string }
type FAQItem = { question: string; answer: string }
type View = 'info' | 'community'

interface Props {
  showId: string
  showSlug: string
  showHostId: string
  showDate: string | null
  showCountdown: boolean
  vendorMapUrl: string | null
  logistics: string | null
  vendors: { id: string; tableNumber: string | null; user: { id: string; name: string; businessName: string | null; bio: string | null } }[]
  schedule: ScheduleItem[]
  faq: FAQItem[]
  forumPostCount: number
  isVendor: boolean
  userId?: string
  inventoryItems: { id: string; imageUrl: string; caption: string | null; user: { id: string; name: string; businessName: string | null } }[]
  ontreasureEventSlug?: string | null
  ontreasureUsername?: string | null
  blocks: Array<{ id: string; type: string; title: string | null; content: Record<string, unknown>; sortOrder: number }>
}

// Stable color palette for vendor avatars (cycles by index)
const AVATAR_COLORS = [
  '#d63031', '#0984e3', '#00b894', '#e17055', '#6c5ce7', '#e84393',
  '#00cec9', '#fdcb6e', '#2d3436', '#74b9ff',
]

export default function ShowContent({
  showId, showSlug, showHostId,
  vendorMapUrl, logistics, schedule, faq,
  forumPostCount, isVendor, userId,
  vendors, blocks,
}: Props) {
  const [view, setView] = useState<View>('info')
  const [activeSection, setActiveSection] = useState<string>('')

  const hasVendors = vendors.length > 0
  const hasSchedule = schedule.length > 0
  const hasLogistics = !!logistics
  const hasFaq = faq.length > 0
  const hasMap = !!vendorMapUrl
  const hasBlocks = blocks.length > 0
  const hasAnyInfo = hasVendors || hasSchedule || hasLogistics || hasFaq || hasMap || hasBlocks

  const infoSections = [
    ...(hasVendors   ? [{ id: 'vendors',   label: 'Vendors' }]   : []),
    ...(hasSchedule  ? [{ id: 'schedule',  label: 'Schedule' }]  : []),
    ...(hasLogistics ? [{ id: 'logistics', label: 'Logistics' }] : []),
    ...(hasFaq       ? [{ id: 'faq',       label: 'FAQ' }]       : []),
    ...(hasMap       ? [{ id: 'map',       label: 'Map' }]       : []),
  ]

  useEffect(() => {
    if (view !== 'info' || infoSections.length < 2) return
    const els = infoSections.map(n => document.getElementById(n.id)).filter(Boolean) as HTMLElement[]
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id) }),
      { rootMargin: '-15% 0px -70% 0px' },
    )
    els.forEach(el => obs.observe(el))
    if (els[0]) setActiveSection(els[0].id)
    return () => obs.disconnect()
  }, [view]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>

      {/* ── TAB SWITCHER ── */}
      <div className="flex border-b border-ps-borderLight mb-10">
        <button
          onClick={() => setView('info')}
          className={`flex items-center justify-center gap-2 flex-1 py-4 text-sm font-bold transition-colors relative ${
            view === 'info' ? 'text-ps-text' : 'text-ps-muted hover:text-ps-secondary'
          }`}
        >
          <ClipboardList size={15} />
          Show Info
          {view === 'info' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-ps-accent rounded-full" />}
        </button>
        <button
          onClick={() => setView('community')}
          className={`flex items-center justify-center gap-2 flex-1 py-4 text-sm font-bold transition-colors relative ${
            view === 'community' ? 'text-ps-text' : 'text-ps-muted hover:text-ps-secondary'
          }`}
        >
          <MessageSquare size={15} />
          Community Forum
          {forumPostCount > 0 && (
            <span className={`ml-1 text-xs font-bold px-1.5 py-0.5 rounded-full ${
              view === 'community' ? 'bg-ps-accent text-white' : 'bg-ps-surface2 text-ps-secondary border border-ps-borderLight'
            }`}>
              {forumPostCount}
            </span>
          )}
          {view === 'community' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-ps-accent rounded-full" />}
        </button>
      </div>

      {/* ── INFO VIEW ── */}
      {view === 'info' && (
        <div>

          {/* Section sticky nav — only when multiple sections */}
          {infoSections.length > 1 && (
            <div className="sticky top-[72px] z-20 mb-10">
              <div className="bg-white rounded-2xl border border-ps-borderLight shadow-card-hover px-2 py-2 flex overflow-x-auto scrollbar-hide">
                {infoSections.map(item => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                      activeSection === item.id
                        ? 'bg-ps-accent text-white shadow-sm'
                        : 'text-ps-muted hover:text-ps-text'
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          )}

          {!hasAnyInfo && (
            <div className="rounded-2xl border border-dashed border-ps-border bg-white/60 p-14 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-sm text-ps-secondary font-medium">Show info coming soon</p>
              <p className="text-xs text-ps-muted mt-1">The host hasn&apos;t added details yet.</p>
            </div>
          )}

          <div className="space-y-12">

            {/* Vendors */}
            {hasVendors && (
              <section id="vendors" className="scroll-mt-32">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-ps-accentLight flex items-center justify-center">
                      <Users size={15} className="text-ps-accent" />
                    </div>
                    <div>
                      <h2 className="font-bold text-ps-text text-lg leading-tight">Vendors</h2>
                      <p className="text-xs text-ps-muted">{vendors.length} confirmed at this show</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {vendors.map((v, i) => {
                    const displayName = v.user.businessName ?? v.user.name
                    const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length]
                    return (
                      <div
                        key={v.id}
                        className="bg-white border border-ps-borderLight rounded-2xl p-4 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all group"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-black text-white shrink-0"
                            style={{ background: avatarColor }}
                          >
                            {displayName[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-ps-text text-sm leading-tight truncate">{displayName}</p>
                            {v.user.businessName && (
                              <p className="text-xs text-ps-muted truncate">{v.user.name}</p>
                            )}
                          </div>
                        </div>
                        {v.tableNumber && (
                          <div className="mb-2.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ps-accent bg-ps-accentLight px-2.5 py-1 rounded-lg">
                              <MapPin size={9} /> Table {v.tableNumber}
                            </span>
                          </div>
                        )}
                        {v.user.bio && (
                          <p className="text-xs text-ps-secondary leading-snug line-clamp-2">{v.user.bio}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Schedule */}
            {hasSchedule && (
              <section id="schedule" className="scroll-mt-32">
                <div className="bg-white border border-ps-borderLight rounded-3xl shadow-card overflow-hidden">
                  <div className="px-6 py-5 border-b border-ps-borderLight flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-ps-accentLight flex items-center justify-center">
                      <Clock size={15} className="text-ps-accent" />
                    </div>
                    <h2 className="font-bold text-ps-text text-base">Schedule</h2>
                  </div>
                  <div className="relative px-6 py-6">
                    <div className="absolute left-[30px] top-8 bottom-8 w-px bg-ps-borderLight" />
                    {schedule.map((item, i) => (
                      <div key={i} className={`flex items-start gap-4 relative ${i < schedule.length - 1 ? 'pb-6' : ''}`}>
                        <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-ps-accent shadow-soft shrink-0 mt-0.5 relative z-10" />
                        <div className="flex items-baseline gap-4 flex-1">
                          <span className="text-xs font-black text-ps-accent w-16 shrink-0 tabular-nums">{item.time}</span>
                          <span className="text-sm text-ps-text font-medium">{item.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Logistics */}
            {hasLogistics && (
              <section id="logistics" className="scroll-mt-32">
                <div className="bg-white border border-ps-borderLight rounded-3xl shadow-card overflow-hidden">
                  <div className="px-6 py-5 border-b border-ps-borderLight flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-ps-accentLight flex items-center justify-center">
                      <Info size={15} className="text-ps-accent" />
                    </div>
                    <h2 className="font-bold text-ps-text text-base">Logistics &amp; Info</h2>
                  </div>
                  <div className="px-6 py-6">
                    <p className="text-sm text-ps-secondary leading-relaxed whitespace-pre-line">{logistics}</p>
                  </div>
                </div>
              </section>
            )}

            {/* FAQ */}
            {hasFaq && (
              <section id="faq" className="scroll-mt-32">
                <div className="bg-white border border-ps-borderLight rounded-3xl shadow-card overflow-hidden">
                  <div className="px-6 py-5 border-b border-ps-borderLight">
                    <h2 className="font-bold text-ps-text text-base">Frequently Asked Questions</h2>
                  </div>
                  <div className="p-6">
                    <ShowFAQ items={faq} />
                  </div>
                </div>
              </section>
            )}

            {/* Map */}
            {hasMap && (
              <section id="map" className="scroll-mt-32">
                <div className="bg-white border border-ps-borderLight rounded-3xl shadow-card overflow-hidden">
                  <div className="px-6 py-5 border-b border-ps-borderLight">
                    <h2 className="font-bold text-ps-text text-base">Venue Map</h2>
                  </div>
                  <div className="p-4">
                    <img src={vendorMapUrl!} alt="Venue Map" className="w-full rounded-2xl" />
                  </div>
                </div>
              </section>
            )}

          </div>

          {hasBlocks && (
            <div className="space-y-10 mt-12">
              <ContentBlocks blocks={blocks} />
            </div>
          )}

        </div>
      )}

      {/* ── COMMUNITY FORUM VIEW ── */}
      {view === 'community' && (
        <div>
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-ps-text">Community Forum</h2>
                <p className="text-sm text-ps-secondary mt-1">
                  Connect with vendors &amp; collectors before show day — post ISOs, price checks, trades, and announcements.
                </p>
              </div>
              {forumPostCount > 0 && (
                <span className="shrink-0 text-xs font-bold bg-ps-accent text-white px-3 py-1.5 rounded-full mt-1">
                  {forumPostCount} post{forumPostCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <Forum
            showSlug={showSlug}
            showId={showId}
            showHostId={showHostId}
            isVendor={isVendor}
            currentUserId={userId}
            preview={false}
          />
        </div>
      )}

    </div>
  )
}
