'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Check, Loader2, GripVertical } from 'lucide-react'
import { THEMES } from '@/lib/themes'
import ImageUpload from '@/components/ImageUpload'

type ThemeId = keyof typeof THEMES
interface ScheduleItem { time: string; label: string }
interface FAQItem { question: string; answer: string }

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${enabled ? 'bg-ps-accent' : 'bg-ps-border'}`}
      aria-checked={enabled}
      role="switch"
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

function SectionRow({ label, description, enabled, onToggle, children }: {
  label: string; description: string; enabled: boolean
  onToggle: (v: boolean) => void; children?: React.ReactNode
}) {
  return (
    <div className="border-t border-ps-borderLight pt-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-sm font-semibold text-ps-text">{label}</p>
          <p className="text-xs text-ps-muted mt-0.5">{description}</p>
        </div>
        <Toggle enabled={enabled} onChange={onToggle} />
      </div>
      {enabled && children}
    </div>
  )
}

export default function CustomizationSection({ slug }: { slug: string }) {
  const [theme, setTheme] = useState<ThemeId>('red')
  const [bannerUrl, setBannerUrl] = useState('')
  const [announcement, setAnnouncement] = useState('')
  const [announcementOn, setAnnouncementOn] = useState(false)
  const [showCountdown, setShowCountdown] = useState(true)
  const [scheduleOn, setScheduleOn] = useState(false)
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [logisticsOn, setLogisticsOn] = useState(false)
  const [logistics, setLogistics] = useState('')
  const [faqOn, setFaqOn] = useState(false)
  const [faq, setFaq] = useState<FAQItem[]>([])
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch(`/api/shows/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        setTheme((d.theme ?? 'red') as ThemeId)
        setBannerUrl(d.bannerUrl ?? '')
        setAnnouncement(d.announcementBanner ?? '')
        setAnnouncementOn(!!d.announcementBanner)
        setShowCountdown(d.showCountdown ?? true)
        const sched: ScheduleItem[] = Array.isArray(d.schedule) ? d.schedule : []
        setSchedule(sched)
        setScheduleOn(sched.length > 0)
        setLogistics(d.logistics ?? '')
        setLogisticsOn(!!d.logistics)
        const f: FAQItem[] = Array.isArray(d.faq) ? d.faq : []
        setFaq(f)
        setFaqOn(f.length > 0)
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
        announcementBanner: announcementOn && announcement.trim() ? announcement.trim() : null,
        showCountdown,
        schedule: scheduleOn && schedule.length ? schedule : null,
        logistics: logisticsOn && logistics.trim() ? logistics.trim() : null,
        faq: faqOn && faq.length ? faq : null,
      }),
    })
    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  // ── Schedule helpers ───────────────────────────────
  function addScheduleRow() { setSchedule((s) => [...s, { time: '', label: '' }]) }
  function removeScheduleRow(i: number) { setSchedule((s) => s.filter((_, j) => j !== i)) }
  function updateScheduleRow(i: number, field: 'time' | 'label', val: string) {
    setSchedule((s) => s.map((row, j) => j === i ? { ...row, [field]: val } : row))
  }

  // ── FAQ helpers ────────────────────────────────────
  function addFAQRow() { setFaq((f) => [...f, { question: '', answer: '' }]) }
  function removeFAQRow(i: number) { setFaq((f) => f.filter((_, j) => j !== i)) }
  function updateFAQRow(i: number, field: 'question' | 'answer', val: string) {
    setFaq((f) => f.map((row, j) => j === i ? { ...row, [field]: val } : row))
  }

  const inputClass = 'bg-ps-surface2 border border-ps-border rounded-xl px-3.5 py-2.5 text-ps-text text-sm focus:outline-none focus:border-ps-accent focus:ring-2 focus:ring-ps-accentLight transition-all placeholder:text-ps-muted'

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 size={18} className="animate-spin text-ps-muted" />
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* ── THEME ── */}
      <div>
        <p className="text-sm font-semibold text-ps-text mb-1">Color Theme</p>
        <p className="text-xs text-ps-muted mb-4">Sets the hero gradient and accent color on your show page.</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {(Object.values(THEMES) as (typeof THEMES)[ThemeId][]).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id as ThemeId)}
              className={`group flex flex-col items-center gap-2 p-2.5 rounded-2xl border-2 transition-all ${
                theme === t.id
                  ? 'border-ps-accent bg-ps-accentLight'
                  : 'border-transparent hover:border-ps-borderLight hover:bg-ps-surface2'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl ${t.swatchClass} shadow-sm`} />
              <span className={`text-xs font-medium leading-tight text-center ${theme === t.id ? 'text-ps-accent' : 'text-ps-muted'}`}>
                {t.name}
              </span>
              {theme === t.id && (
                <span className="text-ps-accent text-xs font-bold">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── BANNER IMAGE ── */}
      <div className="border-t border-ps-borderLight pt-5">
        <p className="text-sm font-semibold text-ps-text mb-1">Header Banner</p>
        <p className="text-xs text-ps-muted mb-4">Wide image shown as the hero background on your show page. Replaces the color gradient.</p>
        <ImageUpload
          label=""
          currentUrl={bannerUrl || null}
          onUpload={(url) => setBannerUrl(url)}
        />
      </div>

      {/* ── COUNTDOWN ── */}
      <div className="border-t border-ps-borderLight pt-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-ps-text">Countdown Timer</p>
            <p className="text-xs text-ps-muted mt-0.5">Displays a live countdown above your forum. Requires an event date.</p>
          </div>
          <Toggle enabled={showCountdown} onChange={setShowCountdown} />
        </div>
      </div>

      {/* ── ANNOUNCEMENT BANNER ── */}
      <SectionRow
        label="Announcement Banner"
        description="Pinned message shown prominently on your show page. Great for last-minute updates."
        enabled={announcementOn}
        onToggle={setAnnouncementOn}
      >
        <textarea
          value={announcement}
          onChange={(e) => setAnnouncement(e.target.value)}
          rows={2}
          placeholder="e.g. Parking has moved to Lot B this year. Entry is free!"
          className={inputClass + ' w-full resize-none'}
        />
      </SectionRow>

      {/* ── SCHEDULE ── */}
      <SectionRow
        label="Schedule"
        description="Add a timeline of the day so attendees know what to expect."
        enabled={scheduleOn}
        onToggle={(v) => { setScheduleOn(v); if (v && schedule.length === 0) addScheduleRow() }}
      >
        <div className="space-y-2">
          {schedule.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <GripVertical size={14} className="text-ps-border shrink-0" />
              <input
                type="text"
                value={row.time}
                onChange={(e) => updateScheduleRow(i, 'time', e.target.value)}
                placeholder="9:00 AM"
                className={inputClass + ' w-28 shrink-0'}
              />
              <input
                type="text"
                value={row.label}
                onChange={(e) => updateScheduleRow(i, 'label', e.target.value)}
                placeholder="Doors open"
                className={inputClass + ' flex-1'}
              />
              <button type="button" onClick={() => removeScheduleRow(i)}
                className="text-ps-muted hover:text-red-500 transition-colors p-1 shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addScheduleRow}
            className="flex items-center gap-1.5 text-xs text-ps-accent hover:text-ps-accentHover font-semibold mt-1 transition-colors"
          >
            <Plus size={13} /> Add time slot
          </button>
        </div>
      </SectionRow>

      {/* ── LOGISTICS ── */}
      <SectionRow
        label="Logistics & Info"
        description="Parking, entry fee, what to bring, rules — anything practical for attendees."
        enabled={logisticsOn}
        onToggle={setLogisticsOn}
      >
        <textarea
          value={logistics}
          onChange={(e) => setLogistics(e.target.value)}
          rows={4}
          placeholder="e.g. Free parking in Lot A off Main St. Entry is free. No outside food or drink. Slabs must be in holders."
          className={inputClass + ' w-full resize-none'}
        />
      </SectionRow>

      {/* ── FAQ ── */}
      <SectionRow
        label="FAQ"
        description="Answer common questions before attendees have to ask."
        enabled={faqOn}
        onToggle={(v) => { setFaqOn(v); if (v && faq.length === 0) addFAQRow() }}
      >
        <div className="space-y-3">
          {faq.map((row, i) => (
            <div key={i} className="bg-ps-surface2 border border-ps-borderLight rounded-2xl p-3 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-ps-muted uppercase tracking-wide pt-2.5 w-4 shrink-0">Q</span>
                <input
                  type="text"
                  value={row.question}
                  onChange={(e) => updateFAQRow(i, 'question', e.target.value)}
                  placeholder="Is entry free?"
                  className={inputClass + ' flex-1'}
                />
                <button type="button" onClick={() => removeFAQRow(i)}
                  className="text-ps-muted hover:text-red-500 transition-colors p-1 pt-2 shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-ps-muted uppercase tracking-wide pt-2.5 w-4 shrink-0">A</span>
                <textarea
                  value={row.answer}
                  onChange={(e) => updateFAQRow(i, 'answer', e.target.value)}
                  rows={2}
                  placeholder="Yes, admission is always free."
                  className={inputClass + ' flex-1 resize-none'}
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addFAQRow}
            className="flex items-center gap-1.5 text-xs text-ps-accent hover:text-ps-accentHover font-semibold transition-colors"
          >
            <Plus size={13} /> Add question
          </button>
        </div>
      </SectionRow>

      {/* ── SAVE ── */}
      <div className="border-t border-ps-borderLight pt-5 flex items-center justify-between gap-4">
        {success && (
          <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
            <Check size={13} /> Saved
          </span>
        )}
        <div className="ml-auto">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-ps-accent hover:bg-ps-accentHover disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            {saving ? 'Saving…' : 'Save Customization'}
          </button>
        </div>
      </div>
    </div>
  )
}
