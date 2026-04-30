'use client'
import { useState } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { MapPin, Calendar, Users, MessageSquare, ArrowRight } from 'lucide-react'

const CARD_GRADIENTS: Record<string, string> = {
  red:     'from-red-500 to-rose-600',
  navy:    'from-blue-900 to-slate-800',
  emerald: 'from-emerald-500 to-green-600',
  gold:    'from-amber-400 to-orange-500',
  slate:   'from-slate-500 to-slate-700',
  purple:  'from-violet-500 to-purple-700',
}

type ShowCard = {
  id: string; slug: string; name: string; location: string
  date: Date | null; flierUrl: string | null; theme: string | null
  host: { name: string | null }
  _count: { vendors: number; forumPosts: number }
}

type View = 'home' | 'browse'

function ShowTile({ show }: { show: ShowCard }) {
  const grad = CARD_GRADIENTS[show.theme ?? 'red'] ?? CARD_GRADIENTS.red
  return (
    <Link href={`/shows/${show.slug}`} className="group">
      <div className="bg-white border border-ps-borderLight rounded-3xl overflow-hidden hover:shadow-card-hover transition-all duration-300 h-full flex flex-col">
        {show.flierUrl ? (
          <div className="relative h-52 overflow-hidden shrink-0">
            <img
              src={show.flierUrl}
              alt={show.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h3 className="font-bold text-lg text-white leading-tight">{show.name}</h3>
            </div>
          </div>
        ) : (
          <div className={`h-52 bg-gradient-to-br ${grad} shrink-0 flex flex-col justify-end p-5`}>
            <h3 className="font-bold text-xl text-white leading-tight drop-shadow-sm">{show.name}</h3>
          </div>
        )}
        <div className="p-5 flex flex-col flex-1">
          <div className="space-y-1.5 mb-auto">
            <div className="flex items-center gap-2 text-ps-secondary text-sm">
              <MapPin size={12} className="text-ps-accent shrink-0" />
              <span className="truncate">{show.location}</span>
            </div>
            {show.date && (
              <div className="flex items-center gap-2 text-ps-secondary text-sm">
                <Calendar size={12} className="text-ps-accent shrink-0" />
                <span>{formatDate(show.date)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 pt-4 mt-4 border-t border-ps-borderLight">
            <span className="flex items-center gap-1.5 text-xs text-ps-muted">
              <Users size={11} /> {show._count.vendors} vendors
            </span>
            <span className="flex items-center gap-1.5 text-xs text-ps-muted">
              <MessageSquare size={11} /> {show._count.forumPosts} posts
            </span>
            <span className="ml-auto text-xs font-semibold text-ps-accent flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              View <ArrowRight size={11} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function HomeContent({ shows }: { shows: ShowCard[] }) {
  const [view, setView] = useState<View>('home')

  return (
    <div>

      {/* ── VIEW TOGGLE ─────────────────────────────────────────── */}
      <div className="flex justify-center mb-10">
        <div className="flex items-center gap-1 bg-white border border-ps-borderLight rounded-full p-1 shadow-soft">
          <button
            onClick={() => setView('home')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              view === 'home'
                ? 'bg-ps-text text-white shadow-sm'
                : 'text-ps-secondary hover:text-ps-text'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setView('browse')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              view === 'browse'
                ? 'bg-ps-text text-white shadow-sm'
                : 'text-ps-secondary hover:text-ps-text'
            }`}
          >
            Find Shows Near Me
          </button>
        </div>
      </div>

      {/* ── HOME VIEW ───────────────────────────────────────────── */}
      {view === 'home' && (
        <>
          {/* HERO */}
          <section className="bg-[#0f0f0f] rounded-[2rem] overflow-hidden mb-16">
            <div className="max-w-5xl mx-auto px-8 pt-16 pb-0 grid md:grid-cols-2 gap-16 items-center">

              {/* Left — copy */}
              <div className="pb-16">
                <div className="inline-flex items-center gap-2 bg-white/10 text-white/50 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-7 tracking-widest uppercase">
                  🎴 Card Show Central
                </div>
                <h1 className="text-5xl sm:text-6xl font-bold leading-[1.06] tracking-tight text-white mb-6">
                  The hub for every card show.
                </h1>
                <p className="text-white/45 text-base leading-relaxed mb-10 max-w-xs">
                  Let vendors apply online, build a community board, and keep attendees in the loop — all before show day.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/shows/new"
                    className="bg-ps-accent hover:bg-ps-accentHover text-white px-7 py-3.5 rounded-full font-bold text-sm transition-colors"
                  >
                    Host a show
                  </Link>
                  <button
                    onClick={() => setView('browse')}
                    className="bg-white/10 hover:bg-white/15 text-white px-7 py-3.5 rounded-full font-bold text-sm transition-colors"
                  >
                    Browse shows
                  </button>
                </div>
              </div>

              {/* Right — UI mockup */}
              <div className="relative pb-10 hidden md:flex items-end justify-center">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-72 -rotate-1 relative z-10">
                  <div className="bg-gradient-to-br from-red-500 to-rose-700 px-5 py-4">
                    <div className="text-white font-bold text-sm mb-0.5">Columbus Card Show</div>
                    <div className="text-white/70 text-xs">Columbus, OH · June 14, 2026</div>
                  </div>
                  <div className="p-4 space-y-2">
                    {[
                      { initials: 'J', color: 'bg-blue-100 text-blue-600',        name: "Jake's Cards",   msg: 'ISO: 1st Ed Charizard PSA 9+, paying $8k' },
                      { initials: 'M', color: 'bg-emerald-100 text-emerald-600',  name: 'Midwest Slabs',  msg: 'Have Japanese shadowless Base — looking to trade' },
                      { initials: 'S', color: 'bg-amber-100 text-amber-600',      name: 'SlabKing',       msg: 'Price check: LP Shadowless Blastoise raw?' },
                    ].map((p) => (
                      <div key={p.name} className="flex gap-2.5 items-start">
                        <div className={`w-6 h-6 rounded-full ${p.color} text-xs font-bold flex items-center justify-center shrink-0 mt-0.5`}>
                          {p.initials}
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                          <div className="text-xs font-semibold text-gray-700 mb-0.5">{p.name}</div>
                          <div className="text-xs text-gray-400 leading-snug">{p.msg}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 pb-4 flex items-center gap-2">
                    <span className="text-xs bg-green-50 text-green-600 font-semibold px-2.5 py-1 rounded-full border border-green-200">
                      ✓ 14 vendors confirmed
                    </span>
                    <span className="text-xs text-gray-300">3 days to go</span>
                  </div>
                </div>
                <div className="absolute bottom-12 -right-2 bg-white rounded-2xl shadow-xl p-3.5 rotate-2 border border-gray-100 w-40 z-20">
                  <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide font-semibold">New application</div>
                  <div className="text-sm font-bold text-gray-900 mb-1.5 leading-tight">Cards &amp; Charizards</div>
                  <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-200 font-semibold">Slabs · Vintage</span>
                </div>
              </div>
            </div>
          </section>

          {/* FEATURES */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <p className="text-xs font-bold text-ps-accent uppercase tracking-widest mb-3">Why Card Show Central</p>
              <h2 className="text-4xl font-bold tracking-tight text-ps-text">Built for how shows actually work</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  icon: '💬',
                  title: 'Pre-Show Community Board',
                  body: 'Vendors and collectors connect before the doors even open. ISO posts, price checks, trade offers — all in one real-time feed. Vendors find their buyers. Buyers find exactly what they came for.',
                  bg: 'bg-blue-50 border-blue-100',
                },
                {
                  icon: '📋',
                  title: 'Online Vendor Applications',
                  body: 'No more email chains or spreadsheets. Vendors apply online with inventory details. You review, approve, and assign tables. Past-vendor history is tracked automatically.',
                  bg: 'bg-[#fff5f5] border-red-100',
                },
                {
                  icon: '✨',
                  title: 'A Page Worth Sharing',
                  body: 'Your show gets a polished, shareable page — schedule, logistics, FAQ, live countdown. One link gives attendees everything they need. Upload your flier or banner and make it yours.',
                  bg: 'bg-violet-50 border-violet-100',
                },
              ].map((f) => (
                <div key={f.title} className={`${f.bg} border rounded-3xl p-8`}>
                  <div className="text-3xl mb-5">{f.icon}</div>
                  <h3 className="font-bold text-lg text-ps-text mb-3 leading-tight">{f.title}</h3>
                  <p className="text-ps-secondary text-sm leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* SHOW PREVIEW */}
          {shows.length > 0 && (
            <section className="mb-16">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <p className="text-xs font-bold text-ps-accent uppercase tracking-widest mb-1.5">Upcoming Events</p>
                  <h2 className="text-3xl font-bold tracking-tight text-ps-text">Upcoming shows</h2>
                </div>
                <button
                  onClick={() => setView('browse')}
                  className="text-sm font-semibold text-ps-secondary hover:text-ps-text transition-colors flex items-center gap-1.5 shrink-0"
                >
                  See all <ArrowRight size={13} />
                </button>
              </div>
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {shows.slice(0, 6).map((show) => (
                  <ShowTile key={show.id} show={show} />
                ))}
              </div>
            </section>
          )}

          {/* HOST CTA */}
          <section className="bg-[#0f0f0f] rounded-3xl px-8 py-16 text-center mb-4">
            <p className="text-xs font-bold text-ps-accent uppercase tracking-widest mb-4">For organizers</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4 leading-tight">
              Set up your show page<br />in minutes.
            </h2>
            <p className="text-white/40 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
              Vendor applications, community board, schedule, and everything attendees need — all in one shareable link.
            </p>
            <Link
              href="/shows/new"
              className="inline-flex items-center gap-2 bg-ps-accent hover:bg-ps-accentHover text-white px-8 py-3.5 rounded-full font-bold text-sm transition-colors"
            >
              Create your show page <ArrowRight size={14} />
            </Link>
          </section>
        </>
      )}

      {/* ── BROWSE VIEW ─────────────────────────────────────────── */}
      {view === 'browse' && (
        <section>
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-bold text-ps-accent uppercase tracking-widest mb-1.5">All Events</p>
              <h2 className="text-3xl font-bold tracking-tight text-ps-text">Find a show near you</h2>
            </div>
            <Link
              href="/shows/new"
              className="text-sm font-semibold text-ps-secondary hover:text-ps-text transition-colors flex items-center gap-1.5 shrink-0"
            >
              Host your own <ArrowRight size={13} />
            </Link>
          </div>

          {shows.length === 0 ? (
            <div className="bg-white rounded-3xl border border-ps-borderLight p-20 text-center shadow-card">
              <div className="text-5xl mb-4">🎴</div>
              <p className="text-ps-text font-bold text-lg mb-2">No shows yet</p>
              <p className="text-ps-muted text-sm mb-6">Be the first to host a card show on Card Show Central.</p>
              <Link
                href="/shows/new"
                className="inline-flex items-center gap-2 bg-ps-accent hover:bg-ps-accentHover text-white px-6 py-3 rounded-full text-sm font-semibold transition-colors"
              >
                Host the first show <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {shows.map((show) => (
                <ShowTile key={show.id} show={show} />
              ))}
            </div>
          )}
        </section>
      )}

    </div>
  )
}
