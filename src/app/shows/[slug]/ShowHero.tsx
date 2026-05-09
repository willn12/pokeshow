'use client'

import { useState, useEffect } from 'react'
import { MapPin, Calendar, Users, MessageSquare, Settings, Globe, Link2 } from 'lucide-react'
import Link from 'next/link'
import ShowActions from './ShowActions'
import { formatDate } from '@/lib/utils'

interface SocialLinks { instagram?: string; twitter?: string; facebook?: string; tiktok?: string; website?: string }

interface ShowForHero {
  id: string
  slug: string
  name: string
  location: string
  date: string | null
  description: string | null
  tagline?: string | null
  bannerUrl: string | null
  flierUrl: string | null
  showCountdown: boolean
  applicationsOpen: boolean
  hostId: string
  host: { id: string; name: string }
  _count: { vendors: number; forumPosts: number }
  socialLinks?: SocialLinks | null
}

interface Props {
  show: ShowForHero
  heroGradient: string
  heroAccent: string
  isHost: boolean
  isVendor: boolean
  userId?: string
  applicationStatus?: string | null
}

function pad(n: number) { return String(n).padStart(2, '0') }

function HeroCountdown({ targetDate, accent }: { targetDate: string; accent: string }) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 })
  const [ready, setReady] = useState(false)
  const [past, setPast] = useState(false)

  useEffect(() => {
    function calc() {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff <= 0) { setPast(true); return }
      setT({
        d: Math.floor(diff / 86_400_000),
        h: Math.floor((diff % 86_400_000) / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1_000),
      })
    }
    calc()
    setReady(true)
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  if (!ready || past) return null

  return (
    <div className="mt-8">
      <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: accent }}>
        Countdown to show day
      </p>
      <div className="flex items-stretch gap-2 sm:gap-3">
        {[
          { val: t.d, label: 'DAYS' },
          { val: t.h, label: 'HRS' },
          { val: t.m, label: 'MIN' },
          { val: t.s, label: 'SEC' },
        ].map(({ val, label }) => (
          <div key={label} className="flex flex-col items-center gap-1.5">
            <div className="bg-black/30 backdrop-blur-sm border border-white/15 rounded-xl sm:rounded-2xl px-3 sm:px-5 py-2.5 sm:py-4 min-w-[52px] sm:min-w-[72px] text-center">
              <span className="text-2xl sm:text-4xl md:text-5xl font-black text-white tabular-nums leading-none tracking-tight">
                {pad(val)}
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-white/50 uppercase tracking-widest">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ShowHero({
  show, heroGradient, heroAccent, isHost, isVendor, userId, applicationStatus,
}: Props) {
  const hasBanner = !!show.bannerUrl
  const hasFlier = !!show.flierUrl

  const bgStyle = hasBanner
    ? { backgroundImage: `url(${show.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: heroGradient }

  return (
    <div style={bgStyle} className="relative flex flex-col">

      {/* overlay for banner images */}
      {hasBanner && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/80 pointer-events-none" />
      )}

      {/* subtle noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />

      {/* main hero content */}
      <div className="relative flex-1 flex flex-col min-h-[82vh]">
        <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-4 sm:px-8 py-10 sm:py-16">

          {/* top-right controls */}
          <div className="flex items-start justify-end mb-auto">
            {isHost && (
              <Link
                href={`/shows/${show.slug}/edit`}
                className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/20 text-xs font-semibold px-4 py-2 rounded-full transition-all"
              >
                <Settings size={12} /> Manage Show
              </Link>
            )}
          </div>

          {/* hero body — pushed to bottom half */}
          <div className={`mt-auto pt-16 pb-4 ${!hasBanner && hasFlier ? 'md:pr-52 lg:pr-64' : ''}`}>

            {/* eyebrow badge */}
            <div
              className="inline-flex items-center gap-1.5 border text-[11px] font-bold px-3.5 py-1.5 rounded-full mb-5 w-fit tracking-wider uppercase"
              style={{ background: `${heroAccent}22`, borderColor: `${heroAccent}44`, color: heroAccent }}
            >
              Pokemon Card Show
            </div>

            {/* show name */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-none tracking-tight mb-3"
              style={{ textShadow: '0 2px 40px rgba(0,0,0,0.6)' }}>
              {show.name}
            </h1>

            {/* tagline */}
            {show.tagline && (
              <p className="text-white/60 text-lg sm:text-xl italic mb-5 leading-snug max-w-2xl">
                {show.tagline}
              </p>
            )}

            {/* location + date pills */}
            <div className="flex flex-wrap gap-2.5 mb-5">
              <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm text-white font-medium">
                <MapPin size={13} /> {show.location}
              </span>
              {show.date && (
                <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm text-white font-medium">
                  <Calendar size={13} /> {formatDate(new Date(show.date))}
                </span>
              )}
            </div>

            {/* description */}
            {show.description && (
              <p className="text-white/65 text-base sm:text-lg leading-relaxed max-w-2xl mb-2">
                {show.description}
              </p>
            )}

            {/* countdown */}
            {show.showCountdown && show.date && (
              <HeroCountdown targetDate={show.date} accent={heroAccent} />
            )}

            {/* CTA actions */}
            <div className="mt-8 flex items-center gap-3 flex-wrap">
              <ShowActions
                show={show}
                isHost={isHost}
                isVendor={isVendor}
                userId={userId}
                applicationStatus={applicationStatus}
                applicationsOpen={show.applicationsOpen}
                variant="hero"
              />
            </div>

            {/* Social links */}
            {show.socialLinks && Object.values(show.socialLinks).some(Boolean) && (
              <div className="flex items-center gap-2 mt-5 flex-wrap">
                {[
                  { key: 'instagram', label: 'Instagram', href: show.socialLinks.instagram },
                  { key: 'twitter',   label: 'X / Twitter', href: show.socialLinks.twitter },
                  { key: 'facebook',  label: 'Facebook', href: show.socialLinks.facebook },
                  { key: 'tiktok',    label: 'YouTube', href: show.socialLinks.tiktok },
                  { key: 'website',   label: null, href: show.socialLinks.website, icon: true },
                ].filter((s) => s.href).map((s) => (
                  <a
                    key={s.key}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 hover:bg-white/20 text-white/80 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
                  >
                    {s.icon ? <Globe size={11} /> : <Link2 size={10} />}
                    {s.icon ? 'Website' : s.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* flier float — only for gradient (no-banner) shows */}
        {!hasBanner && hasFlier && (
          <div className="absolute right-4 sm:right-8 bottom-16 sm:bottom-20 w-28 sm:w-40 md:w-52 hidden sm:block pointer-events-none">
            <img
              src={show.flierUrl!}
              alt={show.name}
              className="w-full rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] rotate-1 border border-white/15"
            />
          </div>
        )}
      </div>

      {/* bottom metadata strip */}
      <div className="relative bg-black/40 backdrop-blur-sm border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex items-center gap-4 sm:gap-6 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Users size={12} className="text-white/50" />
            <span className="text-sm font-bold text-white">{show._count.vendors}</span>
            <span className="text-xs text-white/40">vendors</span>
          </div>
          <div className="w-px h-3 bg-white/20" />
          <div className="flex items-center gap-1.5">
            <MessageSquare size={12} className="text-white/50" />
            <span className="text-sm font-bold text-white">{show._count.forumPosts}</span>
            <span className="text-xs text-white/40">posts</span>
          </div>
          <div className="w-px h-3 bg-white/20" />
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
              style={{ background: heroAccent, color: '#fff' }}>
              {show.host.name[0].toUpperCase()}
            </div>
            <span className="text-xs text-white/40">Hosted by</span>
            <span className="text-sm font-semibold text-white/90">{show.host.name}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
