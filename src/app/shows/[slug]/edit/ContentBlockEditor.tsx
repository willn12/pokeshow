'use client'
import { useState, useCallback, useEffect } from 'react'
import { Plus, ChevronUp, ChevronDown, Trash2, Check, Loader2, X, Pencil } from 'lucide-react'
import ImageUpload from '@/components/ImageUpload'
import VideoUpload from '@/components/VideoUpload'

// ── Types ─────────────────────────────────────────────────────────

interface GalleryImage { url: string; caption: string }
interface Person { imageUrl: string; name: string; role: string; bio: string }
interface Sponsor { logoUrl: string; name: string; websiteUrl: string; blurb: string }

interface ContentBlock {
  id: string
  type: string
  title: string | null
  content: Record<string, unknown>
  sortOrder: number
}

// ── Block type definitions ─────────────────────────────────────────

const BLOCK_TYPES = [
  { type: 'text',     emoji: '📝', name: 'Text Section',    description: 'A heading with paragraphs. Great for welcome messages, rules, or anything you want to say.', badgeClass: 'bg-blue-50 text-blue-700' },
  { type: 'callout',  emoji: '📣', name: 'Quick Info Box',  description: 'A highlighted callout with icon + text pairs. Perfect for entry fees, parking, dress code, or rules at a glance.', badgeClass: 'bg-emerald-50 text-emerald-700' },
  { type: 'image',    emoji: '🖼️', name: 'Single Image',    description: 'Show one photo with an optional caption. Good for a venue shot or show highlight.', badgeClass: 'bg-purple-50 text-purple-700' },
  { type: 'gallery',  emoji: '📸', name: 'Photo Gallery',   description: 'A grid of photos from your show. Add as many images as you like.', badgeClass: 'bg-indigo-50 text-indigo-700' },
  { type: 'video',    emoji: '🎬', name: 'YouTube Video',   description: 'Embed a YouTube or Vimeo video. Great for show recaps, hype videos, or walkthroughs.', badgeClass: 'bg-red-50 text-red-700' },
  { type: 'people',   emoji: '👥', name: 'Featured People', description: 'Highlight guests, judges, or special vendors with a photo, name, role, and bio.', badgeClass: 'bg-green-50 text-green-700' },
  { type: 'sponsors', emoji: '🤝', name: 'Sponsors',        description: 'Show off sponsors with logos, names, websites, and a short blurb.', badgeClass: 'bg-amber-50 text-amber-700' },
]

function getBadgeClass(type: string) {
  return BLOCK_TYPES.find((t) => t.type === type)?.badgeClass ?? 'bg-gray-100 text-gray-600'
}

function getTypeName(type: string) {
  return BLOCK_TYPES.find((t) => t.type === type)?.name ?? type
}

// ── Helpers ────────────────────────────────────────────────────────

interface CalloutItem { icon: string; text: string }

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

function extractVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/)
  return m ? m[1] : null
}

// ── Shared styles ──────────────────────────────────────────────────

const inputClass = 'w-full bg-white border border-ps-border rounded-lg px-3 py-2.5 text-sm text-ps-text placeholder:text-ps-muted focus:outline-none focus:border-ps-accent transition-colors'
const labelClass = 'block text-xs font-semibold text-ps-muted uppercase tracking-wide mb-1.5'

// ── Block preview (shows what it looks like on the page) ──────────

function BlockPreview({ type, title, content }: { type: string; title: string; content: Record<string, unknown> }) {
  switch (type) {
    case 'text': {
      const body = content.body as string | undefined
      if (!body?.trim()) return <EmptyPreview>Click Edit to add your text</EmptyPreview>
      return (
        <div className="px-5 py-4">
          {title && <h3 className="font-semibold text-ps-text text-base mb-2">{title}</h3>}
          <p className="text-sm text-ps-secondary leading-relaxed whitespace-pre-line">{body}</p>
        </div>
      )
    }
    case 'image': {
      const url = content.url as string | undefined
      if (!url) return <EmptyPreview>Click Edit to upload an image</EmptyPreview>
      return (
        <div className="px-5 py-4">
          {title && <h3 className="font-semibold text-ps-text text-base mb-3">{title}</h3>}
          <img src={url} alt={title || 'Image'} className="w-full rounded-xl max-h-52 object-cover" />
          {(content.caption as string | undefined) && (
            <p className="text-xs text-ps-muted text-center mt-2">{content.caption as string}</p>
          )}
        </div>
      )
    }
    case 'gallery': {
      const images = (content.images as GalleryImage[] | undefined) ?? []
      const visible = images.filter((i) => i.url)
      if (visible.length === 0) return <EmptyPreview>Click Edit to add photos</EmptyPreview>
      return (
        <div className="px-5 py-4">
          {title && <h3 className="font-semibold text-ps-text text-base mb-3">{title}</h3>}
          <div className="grid grid-cols-3 gap-2">
            {visible.slice(0, 6).map((img, i) => (
              <img key={i} src={img.url} alt={img.caption || `Photo ${i + 1}`} className="w-full rounded-lg object-cover aspect-square" />
            ))}
          </div>
          {visible.length > 6 && <p className="text-xs text-ps-muted text-center mt-2">+{visible.length - 6} more</p>}
        </div>
      )
    }
    case 'people': {
      const people = (content.people as Person[] | undefined) ?? []
      if (people.length === 0) return <EmptyPreview>Click Edit to add people</EmptyPreview>
      return (
        <div className="px-5 py-4">
          {title && <h3 className="font-semibold text-ps-text text-base mb-3">{title}</h3>}
          <div className="flex flex-wrap gap-3">
            {people.slice(0, 4).map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                {p.imageUrl
                  ? <img src={p.imageUrl} alt={p.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                  : <div className="w-9 h-9 rounded-full bg-ps-accent text-white flex items-center justify-center text-sm font-bold shrink-0">{p.name?.[0]?.toUpperCase() ?? '?'}</div>
                }
                <div>
                  <p className="text-xs font-semibold text-ps-text leading-tight">{p.name || 'Name'}</p>
                  <p className="text-xs text-ps-muted">{p.role || 'Role'}</p>
                </div>
              </div>
            ))}
            {people.length > 4 && <p className="text-xs text-ps-muted self-center">+{people.length - 4} more</p>}
          </div>
        </div>
      )
    }
    case 'sponsors': {
      const sponsors = (content.sponsors as Sponsor[] | undefined) ?? []
      if (sponsors.length === 0) return <EmptyPreview>Click Edit to add sponsors</EmptyPreview>
      return (
        <div className="px-5 py-4">
          {title && <h3 className="font-semibold text-ps-text text-base mb-3">{title}</h3>}
          <div className="flex flex-wrap gap-2">
            {sponsors.slice(0, 4).map((s, i) => (
              <div key={i} className="flex items-center gap-2 bg-ps-surface2 border border-ps-borderLight rounded-lg px-3 py-1.5">
                {s.logoUrl
                  ? <img src={s.logoUrl} alt={s.name} className="h-5 object-contain" />
                  : <p className="text-xs font-semibold text-ps-text">{s.name || 'Sponsor'}</p>
                }
              </div>
            ))}
            {sponsors.length > 4 && <p className="text-xs text-ps-muted self-center">+{sponsors.length - 4} more</p>}
          </div>
        </div>
      )
    }
    case 'callout': {
      const items = (content.items as CalloutItem[] | undefined) ?? []
      const style = (content.style as string | undefined) ?? 'info'
      const colorMap: Record<string, string> = { info: 'bg-blue-50 border-blue-200', success: 'bg-green-50 border-green-200', warning: 'bg-amber-50 border-amber-200' }
      if (items.length === 0) return <EmptyPreview>Click Edit to add quick-info items</EmptyPreview>
      return (
        <div className={`mx-5 my-4 rounded-xl border px-4 py-4 ${colorMap[style] ?? colorMap.info}`}>
          {title && <p className="text-xs font-bold text-ps-text mb-3">{title}</p>}
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {items.filter((it) => it.text).map((it, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span>{it.icon || '•'}</span>
                <span className="text-ps-text font-medium">{it.text}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    case 'video': {
      const url = content.url as string | undefined
      if (!url) return <EmptyPreview>Upload a video file or paste a YouTube / Vimeo URL</EmptyPreview>
      const ytId = extractYouTubeId(url)
      const vimeoId = extractVimeoId(url)
      const isDirectVideo = !ytId && !vimeoId
      return (
        <div className="px-5 py-4">
          {title && <h3 className="font-semibold text-ps-text text-base mb-3">{title}</h3>}
          {ytId ? (
            <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt="Video thumbnail" className="w-full rounded-xl object-cover aspect-video" />
          ) : isDirectVideo ? (
            <div className="flex justify-center bg-gray-950 rounded-xl overflow-hidden">
              <video src={url} controls className="block max-w-full max-h-52" preload="metadata" />
            </div>
          ) : (
            <div className="bg-gray-900 rounded-xl aspect-video flex items-center justify-center">
              <span className="text-white/60 text-sm">Vimeo — will embed on page</span>
            </div>
          )}
          {(content.caption as string | undefined) && (
            <p className="text-xs text-ps-muted text-center mt-2">{content.caption as string}</p>
          )}
        </div>
      )
    }
    default: return null
  }
}

function EmptyPreview({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 py-6 text-center">
      <p className="text-xs text-ps-muted italic">{children}</p>
    </div>
  )
}

// ── Content editors (unchanged from before) ───────────────────────

function TextEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div>
      <label className={labelClass}>Body Text</label>
      <textarea
        rows={5}
        value={(content.body as string) ?? ''}
        onChange={(e) => onChange({ ...content, body: e.target.value })}
        placeholder="e.g. Welcome to the show! We're thrilled to host collectors from all over the region."
        className={inputClass + ' resize-none'}
      />
    </div>
  )
}

function ImageEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <ImageUpload label="Photo" currentUrl={(content.url as string) || null} onUpload={(u) => onChange({ ...content, url: u })} />
      <div>
        <label className={labelClass}>Caption (optional)</label>
        <input type="text" value={(content.caption as string) ?? ''} onChange={(e) => onChange({ ...content, caption: e.target.value })} placeholder="e.g. The main floor at last year's show" className={inputClass} />
      </div>
    </div>
  )
}

function GalleryEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const images: GalleryImage[] = Array.isArray(content.images) ? (content.images as GalleryImage[]) : []
  function updateImage(i: number, patch: Partial<GalleryImage>) {
    onChange({ ...content, images: images.map((img, j) => (j === i ? { ...img, ...patch } : img)) })
  }
  return (
    <div className="space-y-3">
      {images.map((img, i) => (
        <div key={i} className="bg-ps-surface2 border border-ps-borderLight rounded-xl p-3 space-y-2 relative">
          <button type="button" onClick={() => onChange({ ...content, images: images.filter((_, j) => j !== i) })} className="absolute top-2 right-2 text-ps-muted hover:text-red-500 transition-colors"><X size={13} /></button>
          <p className="text-xs font-semibold text-ps-muted uppercase tracking-wide">Photo {i + 1}</p>
          <ImageUpload label="" currentUrl={img.url || null} onUpload={(u) => updateImage(i, { url: u })} />
          <div>
            <label className={labelClass}>Caption (optional)</label>
            <input type="text" value={img.caption} onChange={(e) => updateImage(i, { caption: e.target.value })} placeholder="e.g. Vintage showcase from Hall B" className={inputClass} />
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange({ ...content, images: [...images, { url: '', caption: '' }] })} className="flex items-center gap-1.5 text-xs text-ps-accent font-semibold hover:opacity-80 transition-opacity">
        <Plus size={13} /> Add photo
      </button>
    </div>
  )
}

function PeopleEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const people: Person[] = Array.isArray(content.people) ? (content.people as Person[]) : []
  function updatePerson(i: number, patch: Partial<Person>) {
    onChange({ ...content, people: people.map((p, j) => (j === i ? { ...p, ...patch } : p)) })
  }
  return (
    <div className="space-y-3">
      {people.map((person, i) => (
        <div key={i} className="bg-ps-surface2 border border-ps-borderLight rounded-xl p-3 space-y-2 relative">
          <button type="button" onClick={() => onChange({ ...content, people: people.filter((_, j) => j !== i) })} className="absolute top-2 right-2 text-ps-muted hover:text-red-500 transition-colors"><X size={13} /></button>
          <p className="text-xs font-semibold text-ps-muted uppercase tracking-wide">Person {i + 1}</p>
          <ImageUpload label="Photo" currentUrl={person.imageUrl || null} onUpload={(u) => updatePerson(i, { imageUrl: u })} />
          <input type="text" value={person.name} onChange={(e) => updatePerson(i, { name: e.target.value })} placeholder="Name" className={inputClass} />
          <input type="text" value={person.role} onChange={(e) => updatePerson(i, { role: e.target.value })} placeholder="Role / Title" className={inputClass} />
          <textarea rows={2} value={person.bio} onChange={(e) => updatePerson(i, { bio: e.target.value })} placeholder="Short bio…" className={inputClass + ' resize-none'} />
        </div>
      ))}
      <button type="button" onClick={() => onChange({ ...content, people: [...people, { imageUrl: '', name: '', role: '', bio: '' }] })} className="flex items-center gap-1.5 text-xs text-ps-accent font-semibold hover:opacity-80 transition-opacity">
        <Plus size={13} /> Add person
      </button>
    </div>
  )
}

function SponsorsEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const sponsors: Sponsor[] = Array.isArray(content.sponsors) ? (content.sponsors as Sponsor[]) : []
  function updateSponsor(i: number, patch: Partial<Sponsor>) {
    onChange({ ...content, sponsors: sponsors.map((s, j) => (j === i ? { ...s, ...patch } : s)) })
  }
  return (
    <div className="space-y-3">
      {sponsors.map((sponsor, i) => (
        <div key={i} className="bg-ps-surface2 border border-ps-borderLight rounded-xl p-3 space-y-2 relative">
          <button type="button" onClick={() => onChange({ ...content, sponsors: sponsors.filter((_, j) => j !== i) })} className="absolute top-2 right-2 text-ps-muted hover:text-red-500 transition-colors"><X size={13} /></button>
          <p className="text-xs font-semibold text-ps-muted uppercase tracking-wide">Sponsor {i + 1}</p>
          <ImageUpload label="Logo" currentUrl={sponsor.logoUrl || null} onUpload={(u) => updateSponsor(i, { logoUrl: u })} />
          <input type="text" value={sponsor.name} onChange={(e) => updateSponsor(i, { name: e.target.value })} placeholder="Sponsor Name" className={inputClass} />
          <input type="url" value={sponsor.websiteUrl} onChange={(e) => updateSponsor(i, { websiteUrl: e.target.value })} placeholder="https://example.com" className={inputClass} />
          <textarea rows={2} value={sponsor.blurb} onChange={(e) => updateSponsor(i, { blurb: e.target.value })} placeholder="Short description…" className={inputClass + ' resize-none'} />
        </div>
      ))}
      <button type="button" onClick={() => onChange({ ...content, sponsors: [...sponsors, { logoUrl: '', name: '', websiteUrl: '', blurb: '' }] })} className="flex items-center gap-1.5 text-xs text-ps-accent font-semibold hover:opacity-80 transition-opacity">
        <Plus size={13} /> Add sponsor
      </button>
    </div>
  )
}

function CalloutEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const items: CalloutItem[] = Array.isArray(content.items) ? (content.items as CalloutItem[]) : []
  const style = (content.style as string | undefined) ?? 'info'
  const STYLES = [
    { id: 'info',    label: 'Blue Info',    preview: 'bg-blue-50 border-blue-200 text-blue-700' },
    { id: 'success', label: 'Green Check',  preview: 'bg-green-50 border-green-200 text-green-700' },
    { id: 'warning', label: 'Amber Alert',  preview: 'bg-amber-50 border-amber-200 text-amber-700' },
  ]
  function updateItem(i: number, patch: Partial<CalloutItem>) {
    onChange({ ...content, items: items.map((it, j) => j === i ? { ...it, ...patch } : it) })
  }
  return (
    <div className="space-y-3">
      <div>
        <label className={labelClass}>Box Style</label>
        <div className="flex gap-2">
          {STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange({ ...content, style: s.id })}
              className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                style === s.id ? s.preview + ' border-current' : 'border-ps-borderLight text-ps-secondary hover:border-ps-border'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className={labelClass}>Items</label>
        <div className="space-y-1.5">
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                type="text"
                value={it.icon}
                onChange={(e) => updateItem(i, { icon: e.target.value })}
                placeholder="🎟️"
                className={inputClass + ' w-12 shrink-0 text-center'}
                maxLength={4}
              />
              <input
                type="text"
                value={it.text}
                onChange={(e) => updateItem(i, { text: e.target.value })}
                placeholder="Entry is FREE"
                className={inputClass + ' flex-1'}
              />
              <button type="button" onClick={() => onChange({ ...content, items: items.filter((_, j) => j !== i) })} className="text-ps-muted hover:text-red-500 transition-colors p-1 shrink-0">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => onChange({ ...content, items: [...items, { icon: '', text: '' }] })} className="flex items-center gap-1.5 text-xs text-ps-accent font-semibold hover:opacity-80 transition-opacity mt-2">
          <Plus size={13} /> Add item
        </button>
      </div>
    </div>
  )
}

function VideoEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const url = (content.url as string) ?? ''
  const ytId = extractYouTubeId(url)
  const vimeoId = extractVimeoId(url)
  const isUploaded = url && !ytId && !vimeoId && !url.includes('youtube') && !url.includes('vimeo')

  // Determine active tab based on existing content
  const [tab, setTab] = useState<'upload' | 'embed'>(
    url && !isUploaded ? 'embed' : 'upload'
  )

  function clearUrl() { onChange({ ...content, url: '' }) }

  return (
    <div className="space-y-3">
      {/* Tab selector */}
      <div className="flex rounded-xl border border-ps-borderLight overflow-hidden">
        <button
          type="button"
          onClick={() => setTab('upload')}
          className={`flex-1 py-2 text-xs font-semibold transition-colors ${
            tab === 'upload' ? 'bg-ps-accent text-white' : 'bg-white text-ps-muted hover:text-ps-text'
          }`}
        >
          Upload Video File
        </button>
        <button
          type="button"
          onClick={() => setTab('embed')}
          className={`flex-1 py-2 text-xs font-semibold transition-colors ${
            tab === 'embed' ? 'bg-ps-accent text-white' : 'bg-white text-ps-muted hover:text-ps-text'
          }`}
        >
          Embed YouTube / Vimeo
        </button>
      </div>

      {tab === 'upload' && (
        <>
          {url && isUploaded ? (
            <div className="space-y-2">
              <div className="relative rounded-2xl overflow-hidden flex justify-center bg-gray-950">
                <video src={url} controls className="block max-w-full max-h-52" preload="metadata" />
              </div>
              <button type="button" onClick={clearUrl} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium">
                <X size={11} /> Remove video
              </button>
            </div>
          ) : (
            <VideoUpload
              currentUrl={null}
              onUpload={(u) => { if (u) onChange({ ...content, url: u }) }}
            />
          )}
        </>
      )}

      {tab === 'embed' && (
        <div className="space-y-2">
          <label className={labelClass}>YouTube or Vimeo URL</label>
          <input
            type="url"
            value={ytId || vimeoId ? url : ''}
            onChange={(e) => onChange({ ...content, url: e.target.value })}
            placeholder="https://youtube.com/watch?v=..."
            className={inputClass}
          />
          {url && !ytId && !vimeoId && (
            <p className="text-xs text-amber-600">Paste a YouTube or Vimeo URL — e.g. https://youtube.com/watch?v=abc123</p>
          )}
          {ytId && (
            <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt="Video preview" className="w-full rounded-xl object-cover aspect-video" />
          )}
        </div>
      )}

      <div>
        <label className={labelClass}>Caption (optional)</label>
        <input
          type="text"
          value={(content.caption as string) ?? ''}
          onChange={(e) => onChange({ ...content, caption: e.target.value })}
          placeholder="e.g. Highlights from our 2024 show"
          className={inputClass}
        />
      </div>
    </div>
  )
}

// ── Block card — shows preview + inline editor ─────────────────────

function BlockCard({
  block, isFirst, isLast, isEditing,
  onMoveUp, onMoveDown, onDelete, onSave, onToggleEdit,
}: {
  block: ContentBlock
  isFirst: boolean
  isLast: boolean
  isEditing: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
  onSave: (title: string | null, content: Record<string, unknown>) => Promise<void>
  onToggleEdit: () => void
}) {
  const [title, setTitle] = useState(block.title ?? '')
  const [content, setContent] = useState<Record<string, unknown>>(block.content)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(title || null, content)
    setSaving(false)
    onToggleEdit()
  }

  function handleDeleteClick() {
    if (confirmDelete) {
      onDelete()
    } else {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
    }
  }

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-all ${isEditing ? 'border-ps-accent shadow-md' : 'border-ps-borderLight'}`}>

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-ps-borderLight bg-ps-surface2/50">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${getBadgeClass(block.type)}`}>
          {getTypeName(block.type)}
        </span>
        {title && <span className="text-xs text-ps-muted truncate flex-1 min-w-0">{title}</span>}
        <div className="flex items-center gap-1 ml-auto shrink-0">
          <button type="button" onClick={onMoveUp} disabled={isFirst} className="p-1.5 rounded text-ps-muted hover:text-ps-text hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Move up"><ChevronUp size={13} /></button>
          <button type="button" onClick={onMoveDown} disabled={isLast} className="p-1.5 rounded text-ps-muted hover:text-ps-text hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Move down"><ChevronDown size={13} /></button>
          <button
            type="button"
            onClick={handleDeleteClick}
            className={`ml-1 p-1.5 rounded text-xs font-semibold transition-colors ${confirmDelete ? 'bg-red-600 text-white' : 'text-ps-muted hover:text-red-500 hover:bg-red-50'}`}
            title="Delete section"
          >
            {confirmDelete ? 'Sure?' : <Trash2 size={13} />}
          </button>
          <button
            type="button"
            onClick={onToggleEdit}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ml-1 ${
              isEditing
                ? 'bg-gray-200 text-ps-secondary hover:bg-gray-300'
                : 'bg-ps-accent text-white hover:bg-ps-accentHover'
            }`}
          >
            {isEditing ? <><X size={11} /> Close</> : <><Pencil size={11} /> Edit</>}
          </button>
        </div>
      </div>

      {/* Live preview — always visible, updates as you type */}
      <BlockPreview type={block.type} title={title} content={content} />

      {/* Inline editor — only when editing */}
      {isEditing && (
        <div className="border-t-2 border-ps-accent/20 bg-blue-50/30 px-5 py-5 space-y-4">
          <div>
            <label className={labelClass}>Section Heading</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Featured Guests, Our Sponsors, Show Photos"
              className={inputClass}
            />
          </div>

          {block.type === 'text' && <TextEditor content={content} onChange={setContent} />}
          {block.type === 'callout' && <CalloutEditor content={content} onChange={setContent} />}
          {block.type === 'image' && <ImageEditor content={content} onChange={setContent} />}
          {block.type === 'gallery' && <GalleryEditor content={content} onChange={setContent} />}
          {block.type === 'video' && <VideoEditor content={content} onChange={setContent} />}
          {block.type === 'people' && <PeopleEditor content={content} onChange={setContent} />}
          {block.type === 'sponsors' && <SponsorsEditor content={content} onChange={setContent} />}

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-ps-accent hover:bg-ps-accentHover disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              {saving && <Loader2 size={13} className="animate-spin" />}
              {saving ? 'Saving…' : <><Check size={13} /> Save Section</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main editor ────────────────────────────────────────────────────

export default function ContentBlockEditor({ slug }: { slug: string }) {
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadBlocks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/shows/${slug}/blocks`)
      if (res.ok) {
        const data = await res.json()
        setBlocks(data)
      } else {
        setError('Failed to load sections')
      }
    } catch {
      setError('Network error loading sections')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { loadBlocks() }, [loadBlocks])

  async function addBlock(type: string) {
    setShowPicker(false)
    setError(null)
    const maxOrder = blocks.length > 0 ? Math.max(...blocks.map((b) => b.sortOrder)) : -1
    try {
      const res = await fetch(`/api/shows/${slug}/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, sortOrder: maxOrder + 1 }),
      })
      if (res.ok) {
        const block = await res.json()
        setBlocks((prev) => [...prev, block])
        setExpandedId(block.id)
      } else {
        const data = await res.json()
        setError(data.error || `Failed to add section (${res.status})`)
      }
    } catch {
      setError('Network error — please try again')
    }
  }

  async function saveBlock(id: string, title: string | null, content: Record<string, unknown>) {
    const res = await fetch(`/api/shows/${slug}/blocks`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, title, content }),
    })
    if (res.ok) {
      setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, title, content } : b)))
    }
  }

  async function deleteBlock(id: string) {
    const res = await fetch(`/api/shows/${slug}/blocks?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setBlocks((prev) => prev.filter((b) => b.id !== id))
      if (expandedId === id) setExpandedId(null)
    }
  }

  async function moveBlock(index: number, direction: 'up' | 'down') {
    const next = [...blocks]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= next.length) return
    const aOrder = next[index].sortOrder
    const bOrder = next[swapIndex].sortOrder
    next[index] = { ...next[index], sortOrder: bOrder }
    next[swapIndex] = { ...next[swapIndex], sortOrder: aOrder }
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
    setBlocks(next)
    await fetch(`/api/shows/${slug}/blocks`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order: [
          { id: next[index].id, sortOrder: next[index].sortOrder },
          { id: next[swapIndex].id, sortOrder: next[swapIndex].sortOrder },
        ],
      }),
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-ps-muted" />
      </div>
    )
  }

  return (
    <div className="space-y-3">

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <X size={14} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-600 shrink-0"><X size={12} /></button>
        </div>
      )}

      {/* Empty state */}
      {blocks.length === 0 && !showPicker && (
        <div className="rounded-2xl border-2 border-dashed border-ps-borderLight bg-white p-12 text-center">
          <div className="text-4xl mb-3">🧩</div>
          <p className="text-sm font-semibold text-ps-text mb-1.5">No custom sections yet</p>
          <p className="text-xs text-ps-muted max-w-xs mx-auto mb-6">
            Add sections to your page — feature guests, share photos, highlight sponsors, or write anything for attendees.
          </p>
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="inline-flex items-center gap-2 bg-ps-accent hover:bg-ps-accentHover text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Plus size={15} /> Add Your First Section
          </button>
        </div>
      )}

      {/* Block list */}
      {blocks.map((block, i) => (
        <BlockCard
          key={block.id}
          block={block}
          isFirst={i === 0}
          isLast={i === blocks.length - 1}
          isEditing={expandedId === block.id}
          onMoveUp={() => moveBlock(i, 'up')}
          onMoveDown={() => moveBlock(i, 'down')}
          onDelete={() => deleteBlock(block.id)}
          onSave={(title, content) => saveBlock(block.id, title, content)}
          onToggleEdit={() => setExpandedId(expandedId === block.id ? null : block.id)}
        />
      ))}

      {/* Type picker */}
      {showPicker && (
        <div className="bg-white border border-ps-borderLight rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-ps-text">What kind of section do you want to add?</p>
            <button type="button" onClick={() => setShowPicker(false)} className="text-ps-muted hover:text-ps-text transition-colors"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {BLOCK_TYPES.map((bt) => (
              <button
                key={bt.type}
                type="button"
                onClick={() => addBlock(bt.type)}
                className="flex items-start gap-3 text-left p-3.5 rounded-xl border border-ps-borderLight hover:border-ps-accent hover:bg-ps-accentLight transition-all"
              >
                <span className="text-2xl shrink-0 mt-0.5">{bt.emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-ps-text mb-0.5">{bt.name}</p>
                  <p className="text-xs text-ps-muted leading-snug">{bt.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add section button (when blocks exist) */}
      {!showPicker && blocks.length > 0 && (
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-ps-border rounded-xl py-3 text-sm font-semibold text-ps-muted hover:text-ps-accent hover:border-ps-accent transition-colors"
        >
          <Plus size={15} /> Add Section
        </button>
      )}
    </div>
  )
}
