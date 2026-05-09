'use client'
import { useState, useEffect } from 'react'
import {
  Plus, Trash2, Check, Loader2, GripVertical, MapPin, Calendar,
  Clock, Info, Users, ChevronDown, Globe, Link2, DollarSign,
} from 'lucide-react'
import { THEMES } from '@/lib/themes'
import ImageUpload from '@/components/ImageUpload'
import ContentBlockEditor from './ContentBlockEditor'
import ShowFAQ from '@/components/ShowFAQ'

type ThemeId = keyof typeof THEMES
interface ScheduleItem { time: string; label: string }
interface FAQItem { question: string; answer: string }
interface SocialLinks { instagram?: string; twitter?: string; facebook?: string; tiktok?: string; website?: string }
interface ShowData {
  name: string; location: string; date: string | null
  description: string; tagline: string; hostName: string; vendorCount: number
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
}

// ── Shared UI helpers ───────────────────────────────────────────────

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${enabled ? 'bg-ps-accent' : 'bg-ps-border'}`}
      role="switch"
      aria-checked={enabled}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

const lbl = 'block text-[11px] font-semibold text-ps-muted uppercase tracking-wide mb-1'
const inp = 'w-full bg-white border border-ps-border rounded-lg px-3 py-2 text-ps-text text-xs focus:outline-none focus:border-ps-accent transition-all placeholder:text-ps-muted'

function AccordionSection({
  title, icon: Icon, badge, open, onToggle, children,
}: {
  id: string; title: string; icon: React.ElementType; badge?: string | number
  open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className="border-t border-ps-borderLight">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
      >
        <Icon size={14} className="text-ps-accent shrink-0" />
        <span className="text-xs font-semibold text-ps-text flex-1">{title}</span>
        {badge !== undefined && badge !== '' && (
          <span className="text-[10px] font-bold bg-ps-accentLight text-ps-accent px-2 py-0.5 rounded-full">{badge}</span>
        )}
        <ChevronDown size={13} className={`text-ps-muted transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-5 pb-5 space-y-3">{children}</div>}
    </div>
  )
}

function SocialInput({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-ps-muted uppercase tracking-wide mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <Link2 size={13} className="text-ps-muted shrink-0" />
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inp + ' flex-1'}
        />
      </div>
    </div>
  )
}

// ── Live preview ────────────────────────────────────────────────────

function PreviewHero({
  show, theme, bannerUrl, tagline, showCountdown, social,
}: {
  show: ShowData; theme: typeof THEMES[ThemeId]; bannerUrl: string
  tagline: string; showCountdown: boolean; social: SocialLinks
}) {
  const bgStyle = bannerUrl
    ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: theme.heroGradient }

  // compute rough day count for preview countdown
  const daysLeft = show.date
    ? Math.max(0, Math.ceil((new Date(show.date).getTime() - Date.now()) / 86_400_000))
    : null

  const hasSocial = Object.values(social).some(Boolean)

  return (
    <section className="rounded-xl overflow-hidden relative" style={bgStyle}>
      {bannerUrl && <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/80" />}

      <div className="relative px-5 pt-5 pb-4">
        {/* eyebrow */}
        <div
          className="inline-flex items-center gap-1 border text-[9px] font-bold px-2.5 py-1 rounded-full mb-2.5 w-fit uppercase tracking-wider"
          style={{ background: `${theme.heroAccent}22`, borderColor: `${theme.heroAccent}44`, color: theme.heroAccent }}
        >
          Pokemon Card Show
        </div>

        {/* name */}
        <h1 className="text-xl font-black text-white leading-tight mb-1 tracking-tight">
          {show.name || 'Your Show Name'}
        </h1>

        {/* tagline */}
        {tagline && (
          <p className="text-white/60 text-[11px] leading-snug mb-2.5 italic">{tagline}</p>
        )}

        {/* location + date */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {show.location && (
            <span className="flex items-center gap-1 bg-white/10 border border-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
              <MapPin size={7} /> {show.location}
            </span>
          )}
          {show.date && (
            <span className="flex items-center gap-1 bg-white/10 border border-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
              <Calendar size={7} /> {fmtDate(show.date)}
            </span>
          )}
        </div>

        {/* description */}
        {show.description && (
          <p className="text-white/55 text-[10px] leading-relaxed mb-3 line-clamp-2">{show.description}</p>
        )}

        {/* countdown boxes */}
        {showCountdown && daysLeft !== null && daysLeft >= 0 && (
          <div className="flex items-end gap-1.5 mb-3">
            {[
              { val: daysLeft, label: 'DAYS' },
              { val: 0, label: 'HRS' },
              { val: 0, label: 'MIN' },
              { val: 0, label: 'SEC' },
            ].map(({ val, label }) => (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <div className="bg-black/30 border border-white/15 rounded-lg px-2 py-1.5 min-w-[32px] text-center">
                  <span className="text-sm font-black text-white tabular-nums leading-none">
                    {String(val).padStart(2, '0')}
                  </span>
                </div>
                <span className="text-[7px] font-bold text-white/40 uppercase tracking-wider">{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <span className="inline-block text-[11px] bg-white/15 border border-white/25 text-white px-3.5 py-1.5 rounded-full font-semibold opacity-60 select-none mb-3">
          Apply as Vendor
        </span>

        {/* social links */}
        {hasSocial && (
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            {[
              { k: 'instagram', l: 'Instagram' }, { k: 'twitter', l: 'X / Twitter' },
              { k: 'facebook', l: 'Facebook' }, { k: 'tiktok', l: 'YouTube' }, { k: 'website', l: 'Website' },
            ].filter((s) => social[s.k as keyof SocialLinks]).map((s) => (
              <span key={s.k} className="inline-flex items-center gap-1 bg-white/10 border border-white/15 text-white/60 text-[9px] font-semibold px-2 py-0.5 rounded-full">
                <Link2 size={7} /> {s.l}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* metadata strip */}
      <div className="relative bg-black/30 border-t border-white/10 px-5 py-2 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <Users size={9} className="text-white/40" />
          <span className="text-[10px] font-bold text-white">{show.vendorCount}</span>
          <span className="text-[9px] text-white/35">vendors</span>
        </div>
        {show.hostName && (
          <>
            <div className="w-px h-2.5 bg-white/15" />
            <div className="flex items-center gap-1">
              <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0"
                style={{ background: theme.heroAccent }}>
                {show.hostName[0].toUpperCase()}
              </div>
              <span className="text-[9px] text-white/35">Hosted by</span>
              <span className="text-[10px] font-semibold text-white/70">{show.hostName}</span>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function PreviewSection({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-ps-borderLight rounded-2xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-ps-borderLight flex items-center gap-2">
        <Icon size={12} className="text-ps-accent" />
        <h3 className="font-semibold text-ps-text text-xs">{title}</h3>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────

type SectionId = 'design' | 'hero' | 'announcement' | 'social' | 'payment' | 'schedule' | 'logistics' | 'map' | 'faq'

export default function CustomizationSection({ slug }: { slug: string }) {
  // Design
  const [theme, setTheme] = useState<ThemeId>('red')
  const [bannerUrl, setBannerUrl] = useState('')
  const [flierUrl, setFlierUrl] = useState('')

  // Hero
  const [tagline, setTagline] = useState('')
  const [showCountdown, setShowCountdown] = useState(true)

  // Announcement
  const [announcementOn, setAnnouncementOn] = useState(false)
  const [announcement, setAnnouncement] = useState('')

  // Social
  const [social, setSocial] = useState<SocialLinks>({})

  // Schedule
  const [scheduleOn, setScheduleOn] = useState(false)
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])

  // Logistics
  const [logisticsOn, setLogisticsOn] = useState(false)
  const [logistics, setLogistics] = useState('')

  // Payment
  const [venmoHandle, setVenmoHandle] = useState('')

  // Venue map
  const [vendorMapUrl, setVendorMapUrl] = useState('')

  // FAQ
  const [faqOn, setFaqOn] = useState(false)
  const [faq, setFaq] = useState<FAQItem[]>([])

  // Meta
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [showData, setShowData] = useState<ShowData>({
    name: '', location: '', date: null, description: '', tagline: '', hostName: '', vendorCount: 0,
  })
  const [openSections, setOpenSections] = useState<Set<SectionId>>(new Set<SectionId>(['design', 'hero']))

  function toggleSection(id: SectionId) {
    setOpenSections((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  useEffect(() => {
    fetch(`/api/shows/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        setTheme((d.theme ?? 'red') as ThemeId)
        setBannerUrl(d.bannerUrl ?? '')
        setFlierUrl(d.flierUrl ?? '')
        setTagline(d.tagline ?? '')
        setAnnouncement(d.announcementBanner ?? '')
        setAnnouncementOn(!!d.announcementBanner)
        setShowCountdown(d.showCountdown ?? true)

        const sl = d.socialLinks ?? {}
        setSocial(sl)

        const sched: ScheduleItem[] = Array.isArray(d.schedule) ? d.schedule : []
        setSchedule(sched)
        setScheduleOn(sched.length > 0)

        setLogistics(d.logistics ?? '')
        setLogisticsOn(!!d.logistics)
        setVenmoHandle(d.venmoHandle ?? '')
        setVendorMapUrl(d.vendorMapUrl ?? '')

        const f: FAQItem[] = Array.isArray(d.faq) ? d.faq : []
        setFaq(f)
        setFaqOn(f.length > 0)

        setShowData({
          name: d.name ?? '',
          location: d.location ?? '',
          date: d.date ?? null,
          description: d.description ?? '',
          tagline: d.tagline ?? '',
          hostName: d.host?.name ?? '',
          vendorCount: d.vendors?.length ?? 0,
        })

        // Auto-open sections that have content
        const autoArr: SectionId[] = ['design', 'hero']
        if (d.announcementBanner) autoArr.push('announcement')
        if (d.socialLinks && Object.values(d.socialLinks).some(Boolean)) autoArr.push('social')
        if (d.venmoHandle) autoArr.push('payment')
        if (sched.length > 0) autoArr.push('schedule')
        if (d.logistics) autoArr.push('logistics')
        if (d.vendorMapUrl) autoArr.push('map')
        if (f.length > 0) autoArr.push('faq')
        setOpenSections(new Set(autoArr))

        setLoaded(true)
      })
  }, [slug])

  async function save() {
    setSaving(true)
    setSuccess(false)
    await fetch(`/api/shows/${slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        theme,
        bannerUrl: bannerUrl || null,
        flierUrl: flierUrl || null,
        tagline: tagline.trim() || null,
        showCountdown,
        venmoHandle: venmoHandle.trim().replace(/^@/, '') || null,
        announcementBanner: announcementOn && announcement.trim() ? announcement.trim() : null,
        socialLinks: Object.values(social).some(Boolean) ? social : null,
        schedule: scheduleOn && schedule.length ? schedule : null,
        logistics: logisticsOn && logistics.trim() ? logistics.trim() : null,
        vendorMapUrl: vendorMapUrl || null,
        faq: faqOn && faq.length ? faq : null,
      }),
    })
    setSaving(false)
    setSuccess(true)
    // Sync showData tagline live
    setShowData((d) => ({ ...d, tagline: tagline.trim() }))
    setTimeout(() => setSuccess(false), 3000)
  }

  function addScheduleRow() { setSchedule((s) => [...s, { time: '', label: '' }]) }
  function removeScheduleRow(i: number) { setSchedule((s) => s.filter((_, j) => j !== i)) }
  function setScheduleRow(i: number, field: 'time' | 'label', val: string) {
    setSchedule((s) => s.map((r, j) => j === i ? { ...r, [field]: val } : r))
  }
  function addFAQRow() { setFaq((f) => [...f, { question: '', answer: '' }]) }
  function removeFAQRow(i: number) { setFaq((f) => f.filter((_, j) => j !== i)) }
  function setFAQRow(i: number, field: 'question' | 'answer', val: string) {
    setFaq((f) => f.map((r, j) => j === i ? { ...r, [field]: val } : r))
  }
  function setSocialField(key: keyof SocialLinks, val: string) {
    setSocial((s) => ({ ...s, [key]: val || undefined }))
  }

  const currentTheme = THEMES[theme]
  const visibleSchedule = schedule.filter((s) => s.time || s.label)
  const visibleFaq = faq.filter((f) => f.question)
  const socialCount = Object.values(social).filter(Boolean).length

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── LEFT: Settings panel ── */}
      <div className="w-[400px] shrink-0 flex flex-col border-r border-ps-borderLight bg-white overflow-hidden">
        {!loaded ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 size={18} className="animate-spin text-ps-muted" />
          </div>
        ) : (
          <>
            {/* Scrollable settings */}
            <div className="flex-1 overflow-y-auto">

              {/* Panel header */}
              <div className="px-5 py-4 border-b border-ps-borderLight">
                <p className="text-[11px] font-bold text-ps-muted uppercase tracking-widest">Customize Page</p>
              </div>

              {/* Design */}
              <AccordionSection id="design" title="Design & Media" icon={GripVertical} open={openSections.has('design')} onToggle={() => toggleSection('design')}>
                <div>
                  <label className={lbl}>Color Theme</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(Object.values(THEMES) as (typeof THEMES)[ThemeId][]).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTheme(t.id as ThemeId)}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-all text-left ${
                          theme === t.id ? 'border-ps-accent bg-ps-accentLight' : 'border-ps-borderLight hover:border-ps-border'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-md shrink-0 ${t.swatchClass}`} />
                        <span className={`text-[11px] font-medium leading-tight ${theme === t.id ? 'text-ps-accent' : 'text-ps-secondary'}`}>
                          {t.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={lbl}>Header Banner</label>
                  <p className="text-[11px] text-ps-muted mb-2">Full-width photo behind the hero. Overrides the color theme.</p>
                  <ImageUpload label="" currentUrl={bannerUrl || null} onUpload={setBannerUrl} />
                </div>

                <div>
                  <label className={lbl}>Show Flier</label>
                  <p className="text-[11px] text-ps-muted mb-2">A flier image shown alongside your hero text.</p>
                  <ImageUpload label="" currentUrl={flierUrl || null} onUpload={setFlierUrl} />
                </div>
              </AccordionSection>

              {/* Hero text */}
              <AccordionSection id="hero" title="Hero Text & Countdown" icon={Calendar} open={openSections.has('hero')} onToggle={() => toggleSection('hero')}>
                <div>
                  <label className={lbl}>Tagline <span className="text-ps-border normal-case font-normal">(optional)</span></label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. The Pacific Northwest's Premier Card Show"
                    className={inp}
                    maxLength={120}
                  />
                  <p className="text-[10px] text-ps-muted mt-1">Shown in italics below the show name.</p>
                </div>

                <div className="flex items-start justify-between gap-3 pt-1">
                  <div>
                    <p className="text-xs font-semibold text-ps-text">Countdown Timer</p>
                    <p className="text-[11px] text-ps-muted mt-0.5">Shows big countdown boxes in the hero. Requires a show date.</p>
                  </div>
                  <Toggle enabled={showCountdown} onChange={setShowCountdown} />
                </div>
              </AccordionSection>

              {/* Announcement */}
              <AccordionSection id="announcement" title="Announcement Banner" icon={Info} open={openSections.has('announcement')} onToggle={() => toggleSection('announcement')} badge={announcementOn ? '●' : undefined}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[11px] text-ps-muted leading-snug">Show an amber attention banner above the hero.</p>
                  <Toggle enabled={announcementOn} onChange={setAnnouncementOn} />
                </div>
                {announcementOn && (
                  <textarea
                    value={announcement}
                    onChange={(e) => setAnnouncement(e.target.value)}
                    rows={2}
                    placeholder="e.g. Parking has moved to Lot B this year!"
                    className={inp + ' resize-none'}
                  />
                )}
              </AccordionSection>

              {/* Social Links */}
              <AccordionSection id="social" title="Social Links" icon={Globe} open={openSections.has('social')} onToggle={() => toggleSection('social')} badge={socialCount || undefined}>
                <p className="text-[11px] text-ps-muted">Add links shown in the hero. Paste full URLs (including https://).</p>
                <SocialInput label="Instagram" value={social.instagram ?? ''} onChange={(v) => setSocialField('instagram', v)} placeholder="https://instagram.com/yourshow" />
                <SocialInput label="Twitter / X" value={social.twitter ?? ''} onChange={(v) => setSocialField('twitter', v)} placeholder="https://twitter.com/yourshow" />
                <SocialInput label="Facebook" value={social.facebook ?? ''} onChange={(v) => setSocialField('facebook', v)} placeholder="https://facebook.com/yourshow" />
                <SocialInput label="YouTube" value={social.tiktok ?? ''} onChange={(v) => setSocialField('tiktok', v)} placeholder="https://youtube.com/@yourshow" />
                <SocialInput label="Website" value={social.website ?? ''} onChange={(v) => setSocialField('website', v)} placeholder="https://yourshow.com" />
              </AccordionSection>

              {/* Payment */}
              <AccordionSection id="payment" title="Vendor Payment" icon={DollarSign} open={openSections.has('payment')} onToggle={() => toggleSection('payment')} badge={venmoHandle ? '●' : undefined}>
                <p className="text-[11px] text-ps-muted leading-snug">
                  Vendors receive this Venmo handle in their approval email so they know who to pay and how much.
                </p>
                <div>
                  <label className={lbl}>Venmo Handle</label>
                  <div className="flex items-center gap-2">
                    <span className="text-ps-muted text-sm font-bold shrink-0">@</span>
                    <input
                      type="text"
                      value={venmoHandle.replace(/^@/, '')}
                      onChange={(e) => setVenmoHandle(e.target.value.replace(/^@/, ''))}
                      placeholder="yourvenmo"
                      className={inp + ' flex-1'}
                    />
                  </div>
                  <p className="text-[10px] text-ps-muted mt-1">Shown to vendors after they&apos;re approved. You&apos;ll manually mark them &quot;Confirmed&quot; once payment arrives.</p>
                </div>
              </AccordionSection>

              {/* Schedule */}
              <AccordionSection id="schedule" title="Day-of Schedule" icon={Clock} open={openSections.has('schedule')} onToggle={() => toggleSection('schedule')} badge={scheduleOn && schedule.length > 0 ? schedule.length : undefined}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[11px] text-ps-muted leading-snug">Timeline of events for attendees.</p>
                  <Toggle enabled={scheduleOn} onChange={(v) => { setScheduleOn(v); if (v && schedule.length === 0) addScheduleRow() }} />
                </div>
                {scheduleOn && (
                  <div className="space-y-1.5">
                    {schedule.map((row, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <GripVertical size={12} className="text-ps-border shrink-0" />
                        <input type="text" value={row.time} onChange={(e) => setScheduleRow(i, 'time', e.target.value)} placeholder="9:00 AM" className={inp + ' w-[80px] shrink-0'} />
                        <input type="text" value={row.label} onChange={(e) => setScheduleRow(i, 'label', e.target.value)} placeholder="Doors open" className={inp + ' flex-1'} />
                        <button type="button" onClick={() => removeScheduleRow(i)} className="text-ps-muted hover:text-red-500 transition-colors p-1 shrink-0">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={addScheduleRow} className="flex items-center gap-1 text-[11px] text-ps-accent font-semibold hover:opacity-80 mt-1">
                      <Plus size={11} /> Add time slot
                    </button>
                  </div>
                )}
              </AccordionSection>

              {/* Logistics */}
              <AccordionSection id="logistics" title="Logistics & Info" icon={Info} open={openSections.has('logistics')} onToggle={() => toggleSection('logistics')} badge={logisticsOn && logistics.trim() ? '●' : undefined}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[11px] text-ps-muted leading-snug">Parking, entry fee, rules — practical attendee info.</p>
                  <Toggle enabled={logisticsOn} onChange={setLogisticsOn} />
                </div>
                {logisticsOn && (
                  <textarea
                    value={logistics}
                    onChange={(e) => setLogistics(e.target.value)}
                    rows={4}
                    placeholder="e.g. Free parking in Lot A off Main St. Entry is always free. Tables start at $25."
                    className={inp + ' resize-none'}
                  />
                )}
              </AccordionSection>

              {/* Venue Map */}
              <AccordionSection id="map" title="Venue / Floor Plan Map" icon={MapPin} open={openSections.has('map')} onToggle={() => toggleSection('map')} badge={vendorMapUrl ? '●' : undefined}>
                <p className="text-[11px] text-ps-muted mb-2">Upload a seating chart or floor plan. Shown in the Show Info section.</p>
                <ImageUpload label="" currentUrl={vendorMapUrl || null} onUpload={setVendorMapUrl} />
              </AccordionSection>

              {/* FAQ */}
              <AccordionSection id="faq" title="FAQ" icon={Users} open={openSections.has('faq')} onToggle={() => toggleSection('faq')} badge={faqOn && faq.length > 0 ? faq.length : undefined}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[11px] text-ps-muted leading-snug">Answer common questions before people have to ask.</p>
                  <Toggle enabled={faqOn} onChange={(v) => { setFaqOn(v); if (v && faq.length === 0) addFAQRow() }} />
                </div>
                {faqOn && (
                  <div className="space-y-2">
                    {faq.map((row, i) => (
                      <div key={i} className="bg-ps-surface2 border border-ps-borderLight rounded-xl p-3 space-y-1.5 relative">
                        <button type="button" onClick={() => removeFAQRow(i)} className="absolute top-2.5 right-2.5 text-ps-muted hover:text-red-500 transition-colors">
                          <Trash2 size={11} />
                        </button>
                        <div className="flex items-start gap-1.5 pr-5">
                          <span className="text-[10px] font-bold text-ps-muted uppercase pt-2 shrink-0 w-3">Q</span>
                          <input type="text" value={row.question} onChange={(e) => setFAQRow(i, 'question', e.target.value)} placeholder="Is entry free?" className={inp} />
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="text-[10px] font-bold text-ps-muted uppercase pt-2 shrink-0 w-3">A</span>
                          <textarea rows={2} value={row.answer} onChange={(e) => setFAQRow(i, 'answer', e.target.value)} placeholder="Yes, always free." className={inp + ' resize-none'} />
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={addFAQRow} className="flex items-center gap-1 text-[11px] text-ps-accent font-semibold hover:opacity-80 mt-1">
                      <Plus size={11} /> Add question
                    </button>
                  </div>
                )}
              </AccordionSection>

            </div>

            {/* Sticky save bar */}
            <div className="shrink-0 border-t border-ps-borderLight bg-white px-5 py-3.5 flex items-center gap-3">
              {success && (
                <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <Check size={11} /> Saved
                </span>
              )}
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="ml-auto inline-flex items-center gap-2 bg-ps-accent hover:bg-ps-accentHover disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
              >
                {saving && <Loader2 size={12} className="animate-spin" />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── RIGHT: Live page preview ── */}
      <div className="flex-1 bg-[#dde1e7] overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8">

          {/* Browser chrome */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400/60" />
              <span className="w-3 h-3 rounded-full bg-yellow-400/60" />
              <span className="w-3 h-3 rounded-full bg-green-400/60" />
            </div>
            <div className="flex-1 bg-white/70 rounded-lg px-3 py-1 text-[11px] text-ps-muted font-medium truncate">
              cardshowcentral.com/shows/{slug}
            </div>
            <span className="text-[10px] font-bold text-ps-muted uppercase tracking-widest whitespace-nowrap">Live Preview</span>
          </div>

          {/* Announcement banner — full-width, no rounding */}
          {announcementOn && announcement.trim() && (
            <div className="flex items-start gap-2.5 bg-amber-500 px-4 py-3 mb-1 rounded-t-xl">
              <span className="text-white text-sm shrink-0">📢</span>
              <p className="text-xs text-white font-semibold leading-relaxed">{announcement}</p>
            </div>
          )}

          {/* Hero */}
          {loaded && (
            <PreviewHero
              show={showData}
              theme={currentTheme}
              bannerUrl={bannerUrl}
              tagline={tagline}
              showCountdown={showCountdown}
              social={social}
            />
          )}

          {/* Tab nav */}
          <div className="flex border-b border-ps-borderLight mt-6 mb-5 bg-white rounded-t-xl overflow-hidden">
            <div className="flex-1 py-3 text-center text-xs font-bold text-ps-text border-b-2 border-ps-accent">Show Info</div>
            <div className="flex-1 py-3 text-center text-xs font-bold text-ps-muted">Community Forum</div>
          </div>

          {/* Info sections */}
          <div className="space-y-4">

            {scheduleOn && visibleSchedule.length > 0 && (
              <PreviewSection icon={Clock} title="Schedule">
                <div className="relative space-y-2">
                  {visibleSchedule.map((item, i) => (
                    <div key={i} className="flex items-baseline gap-3">
                      <span className="text-[10px] font-black text-ps-accent w-14 shrink-0 tabular-nums">{item.time}</span>
                      <span className="text-xs text-ps-text">{item.label}</span>
                    </div>
                  ))}
                </div>
              </PreviewSection>
            )}

            {logisticsOn && logistics.trim() && (
              <PreviewSection icon={Info} title="Logistics & Info">
                <p className="text-xs text-ps-secondary leading-relaxed whitespace-pre-line">{logistics}</p>
              </PreviewSection>
            )}

            {faqOn && visibleFaq.length > 0 && (
              <PreviewSection icon={Users} title="FAQ">
                <ShowFAQ items={visibleFaq} />
              </PreviewSection>
            )}

            {vendorMapUrl && (
              <PreviewSection icon={MapPin} title="Venue Map">
                <img src={vendorMapUrl} alt="Venue map" className="w-full rounded-lg" />
              </PreviewSection>
            )}

          </div>

          {/* Custom sections */}
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-ps-border/30" />
              <span className="text-[10px] font-bold text-ps-muted/60 uppercase tracking-widest">Custom Sections</span>
              <div className="flex-1 h-px bg-ps-border/30" />
            </div>
            <ContentBlockEditor slug={slug} />
          </div>

        </div>
      </div>

    </div>
  )
}
