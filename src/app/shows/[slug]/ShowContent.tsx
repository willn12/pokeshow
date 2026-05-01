'use client'
import { useState } from 'react'
import Forum from '@/components/Forum'
import Countdown from '@/components/Countdown'
import ShowFAQ from '@/components/ShowFAQ'
import Link from 'next/link'
import { Clock, Info } from 'lucide-react'

const AVATAR_COLORS = [
  'bg-red-100 text-red-600',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-violet-100 text-violet-700',
  'bg-pink-100 text-pink-700',
]

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

type VendorItem = {
  id: string; tableNumber: string | null
  user: { id: string; name: string; businessName: string | null; bio: string | null }
}

type ScheduleItem = { time: string; label: string }
type FAQItem = { question: string; answer: string }
type View = 'details' | 'community'

interface Props {
  showId: string
  showSlug: string
  showHostId: string
  showDate: string | null
  showCountdown: boolean
  vendorMapUrl: string | null
  logistics: string | null
  vendors: VendorItem[]
  schedule: ScheduleItem[]
  faq: FAQItem[]
  forumPostCount: number
  isVendor: boolean
  userId?: string
  inventoryItems: { id: string; imageUrl: string; caption: string | null; user: { id: string; name: string; businessName: string | null } }[]
}

function bgRemovalUrl(url: string) {
  if (!url.includes('cloudinary.com')) return url
  return url.replace('/upload/', '/upload/e_background_removal/')
}

export default function ShowContent({
  showId, showSlug, showHostId, showDate, showCountdown,
  vendorMapUrl, logistics, vendors, schedule, faq,
  forumPostCount, isVendor, userId, inventoryItems,
}: Props) {
  const [view, setView] = useState<View>('details')

  const hasRightCol = schedule.length > 0 || logistics || faq.length > 0

  return (
    <div>

      {/* ── VIEW SWITCHER ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 mb-10">

        <button
          onClick={() => setView('details')}
          className={`rounded-2xl p-5 sm:p-6 text-left transition-all duration-200 ${
            view === 'details'
              ? 'bg-ps-accent shadow-card-hover'
              : 'bg-white border border-ps-borderLight hover:shadow-card hover:border-ps-border'
          }`}
        >
          <div className="text-2xl mb-3">📋</div>
          <div className={`font-black text-base sm:text-xl tracking-tight uppercase leading-tight ${
            view === 'details' ? 'text-white' : 'text-ps-text'
          }`}>
            Show Details
          </div>
          <div className={`text-xs mt-1.5 leading-relaxed ${
            view === 'details' ? 'text-white/60' : 'text-ps-muted'
          }`}>
            Vendors, schedule & everything you need to know
          </div>
        </button>

        <button
          onClick={() => setView('community')}
          className={`rounded-2xl p-5 sm:p-6 text-left transition-all duration-200 ${
            view === 'community'
              ? 'bg-ps-accent shadow-card-hover'
              : 'bg-white border border-ps-borderLight hover:shadow-card hover:border-ps-border'
          }`}
        >
          <div className="text-2xl mb-3">💬</div>
          <div className={`font-black text-base sm:text-xl tracking-tight uppercase leading-tight ${
            view === 'community' ? 'text-white' : 'text-ps-text'
          }`}>
            Community Forum
          </div>
          <div className={`text-xs mt-1.5 leading-relaxed ${
            view === 'community' ? 'text-white/60' : 'text-ps-muted'
          }`}>
            Connect with vendors &amp; collectors before show day
          </div>
          {forumPostCount > 0 && (
            <div className={`mt-3 text-xs font-bold flex items-center gap-1.5 ${
              view === 'community' ? 'text-white/80' : 'text-ps-accent'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {forumPostCount} active post{forumPostCount !== 1 ? 's' : ''}
            </div>
          )}
        </button>

      </div>

      {/* ── SHOW DETAILS VIEW ─────────────────────────────────── */}
      {view === 'details' && (
        <div>

          {/* Countdown */}
          {showCountdown && showDate && (
            <div className="mb-8">
              <Countdown targetDate={showDate} />
            </div>
          )}

          {/* Featured Inventory */}
          {inventoryItems.length > 0 && (
            <div className="mb-8">
              <h2 className="font-bold text-ps-text flex items-center gap-2 mb-4">
                <span className="w-1 h-5 bg-ps-accent rounded-full inline-block" />
                Featured Inventory
                <span className="text-xs font-normal text-ps-muted">{inventoryItems.length} items from vendors</span>
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {inventoryItems.map(item => {
                  const displayName = item.user.businessName || item.user.name
                  return (
                    <Link key={item.id} href={`/users/${item.user.id}`} className="group shrink-0">
                      <div className="w-36 h-36 rounded-2xl overflow-hidden border border-ps-borderLight shadow-soft relative bg-white">
                        <img
                          src={bgRemovalUrl(item.imageUrl)}
                          onError={(e) => { e.currentTarget.src = item.imageUrl }}
                          alt={item.caption ?? 'Inventory'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <p className="text-xs text-ps-muted mt-1.5 text-center truncate w-36">{displayName}</p>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          <div className={`grid gap-8 ${hasRightCol ? 'md:grid-cols-5' : ''}`}>

            {/* ── VENDORS ── */}
            <div id="vendors" className={hasRightCol ? 'md:col-span-3' : ''}>
              <h2 className="font-bold text-ps-text flex items-center gap-2 mb-4">
                <span className="w-1 h-5 bg-ps-accent rounded-full inline-block" />
                Vendors
                {vendors.length > 0 && (
                  <span className="text-xs font-normal text-ps-muted">{vendors.length} confirmed</span>
                )}
              </h2>

              {vendors.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-ps-border bg-white/60 p-10 text-center">
                  <div className="text-3xl mb-2">🛒</div>
                  <p className="text-sm text-ps-secondary font-medium">No vendors confirmed yet</p>
                  <p className="text-xs text-ps-muted mt-1">Check back closer to the show date.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {vendors.map((v) => {
                    const displayName = v.user.businessName || v.user.name
                    return (
                      <Link key={v.id} href={`/users/${v.user.id}`}>
                        <div className="bg-white border border-ps-borderLight rounded-2xl p-4 shadow-soft flex items-start gap-3 hover:shadow-card transition-shadow">
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
                      </Link>
                    )
                  })}
                </div>
              )}

              {/* Vendor map */}
              {vendorMapUrl && (
                <div className="mt-6">
                  <h3 className="font-bold text-ps-text flex items-center gap-2 mb-3">
                    <span className="w-1 h-5 bg-ps-accent rounded-full inline-block" />
                    Vendor Map
                  </h3>
                  <div className="bg-white border border-ps-borderLight rounded-2xl overflow-hidden shadow-soft">
                    <img src={vendorMapUrl} alt="Vendor Map" className="w-full" />
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN: Schedule + Logistics + FAQ ── */}
            {hasRightCol && (
              <div className="md:col-span-2 space-y-6">

                {schedule.length > 0 && (
                  <div id="schedule">
                    <h2 className="font-bold text-ps-text flex items-center gap-2 mb-4">
                      <span className="w-1 h-5 bg-ps-accent rounded-full inline-block" />
                      <Clock size={14} className="text-ps-accent" />
                      Schedule
                    </h2>
                    <div className="bg-white border border-ps-borderLight rounded-2xl shadow-soft overflow-hidden">
                      <div className="relative p-5">
                        <div className="absolute left-[28px] top-7 bottom-7 w-px bg-ps-borderLight" />
                        {schedule.map((item, i) => (
                          <div key={i} className={`flex items-start gap-4 relative ${i < schedule.length - 1 ? 'pb-4' : ''}`}>
                            <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-ps-accent shadow-soft shrink-0 mt-0.5 relative z-10" />
                            <div className="flex items-baseline gap-3 flex-1">
                              <span className="text-xs font-bold text-ps-accent w-14 shrink-0">{item.time}</span>
                              <span className="text-sm text-ps-text">{item.label}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {logistics && (
                  <div id="logistics">
                    <h2 className="font-bold text-ps-text flex items-center gap-2 mb-3">
                      <span className="w-1 h-5 bg-ps-accent rounded-full inline-block" />
                      <Info size={14} className="text-ps-accent" />
                      Logistics &amp; Info
                    </h2>
                    <div className="bg-white border border-ps-borderLight rounded-2xl shadow-soft px-5 py-4">
                      <p className="text-sm text-ps-secondary leading-relaxed whitespace-pre-line">{logistics}</p>
                    </div>
                  </div>
                )}

                {faq.length > 0 && (
                  <div id="faq">
                    <h2 className="font-bold text-ps-text flex items-center gap-2 mb-3">
                      <span className="w-1 h-5 bg-ps-accent rounded-full inline-block" />
                      FAQ
                    </h2>
                    <ShowFAQ items={faq} />
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      )}

      {/* ── COMMUNITY VIEW ────────────────────────────────────── */}
      {view === 'community' && (
        <Forum
          showSlug={showSlug}
          showId={showId}
          showHostId={showHostId}
          isVendor={isVendor}
          currentUserId={userId}
          preview={false}
        />
      )}

    </div>
  )
}
