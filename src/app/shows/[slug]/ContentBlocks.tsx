interface ContentBlock {
  id: string
  type: string
  title: string | null
  content: Record<string, unknown>
  sortOrder: number
}

interface GalleryImage { url: string; caption: string }
interface Person { imageUrl: string; name: string; role: string; bio: string }
interface Sponsor { logoUrl: string; name: string; websiteUrl: string; blurb: string }
interface CalloutItem { icon: string; text: string }

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

function extractVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/)
  return m ? m[1] : null
}

function hasContent(block: ContentBlock): boolean {
  switch (block.type) {
    case 'text': return !!(block.content.body as string | undefined)?.trim()
    case 'image': return !!(block.content.url as string | undefined)
    case 'gallery': return !!((block.content.images as GalleryImage[] | undefined)?.some((img) => img.url))
    case 'people': return !!((block.content.people as Person[] | undefined)?.length)
    case 'sponsors': return !!((block.content.sponsors as Sponsor[] | undefined)?.length)
    case 'callout': return !!((block.content.items as CalloutItem[] | undefined)?.some((it) => it.text))
    case 'video': return !!(block.content.url as string | undefined)
    default: return false
  }
}

function TextBlock({ block }: { block: ContentBlock }) {
  const body = block.content.body as string | undefined
  return (
    <section className="bg-white border border-ps-borderLight rounded-3xl shadow-card overflow-hidden">
      {block.title && (
        <div className="px-6 py-4 border-b border-ps-borderLight">
          <h2 className="font-semibold text-ps-text text-sm">{block.title}</h2>
        </div>
      )}
      <div className="px-6 py-5">
        <p className="text-sm text-ps-secondary leading-relaxed whitespace-pre-line">{body}</p>
      </div>
    </section>
  )
}

function ImageBlock({ block }: { block: ContentBlock }) {
  const url = block.content.url as string | undefined
  const caption = block.content.caption as string | undefined
  if (!url) return null
  return (
    <section className="bg-white border border-ps-borderLight rounded-3xl shadow-card overflow-hidden">
      {block.title && (
        <div className="px-6 py-4 border-b border-ps-borderLight">
          <h2 className="font-semibold text-ps-text text-sm">{block.title}</h2>
        </div>
      )}
      <div className="px-6 py-5">
        <img src={url} alt={caption ?? block.title ?? 'Image'} className="w-full rounded-xl" />
        {caption && (
          <p className="text-xs text-ps-muted text-center mt-2">{caption}</p>
        )}
      </div>
    </section>
  )
}

function GalleryBlock({ block }: { block: ContentBlock }) {
  const images = (block.content.images as GalleryImage[] | undefined) ?? []
  const visible = images.filter((img) => img.url)
  if (visible.length === 0) return null
  return (
    <section className="bg-white border border-ps-borderLight rounded-3xl shadow-card overflow-hidden">
      {block.title && (
        <div className="px-6 py-4 border-b border-ps-borderLight">
          <h2 className="font-semibold text-ps-text text-sm">{block.title}</h2>
        </div>
      )}
      <div className="px-6 py-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {visible.map((img, i) => (
            <div key={i}>
              <img src={img.url} alt={img.caption || `Photo ${i + 1}`} className="w-full rounded-xl object-cover aspect-square" />
              {img.caption && (
                <p className="text-xs text-ps-muted text-center mt-1">{img.caption}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PeopleBlock({ block }: { block: ContentBlock }) {
  const people = (block.content.people as Person[] | undefined) ?? []
  if (people.length === 0) return null
  return (
    <section className="bg-white border border-ps-borderLight rounded-3xl shadow-card overflow-hidden">
      {block.title && (
        <div className="px-6 py-4 border-b border-ps-borderLight">
          <h2 className="font-semibold text-ps-text text-sm">{block.title}</h2>
        </div>
      )}
      <div className="px-6 py-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          {people.map((person, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-2">
              {person.imageUrl ? (
                <img
                  src={person.imageUrl}
                  alt={person.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-ps-borderLight"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-ps-accent text-white flex items-center justify-center text-lg font-bold shrink-0">
                  {person.name ? person.name[0].toUpperCase() : '?'}
                </div>
              )}
              {person.name && (
                <p className="text-sm font-bold text-ps-text leading-tight">{person.name}</p>
              )}
              {person.role && (
                <p className="text-xs text-ps-muted">{person.role}</p>
              )}
              {person.bio && (
                <p className="text-xs text-ps-secondary leading-snug">{person.bio}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function SponsorsBlock({ block }: { block: ContentBlock }) {
  const sponsors = (block.content.sponsors as Sponsor[] | undefined) ?? []
  if (sponsors.length === 0) return null
  return (
    <section className="bg-white border border-ps-borderLight rounded-3xl shadow-card overflow-hidden">
      {block.title && (
        <div className="px-6 py-4 border-b border-ps-borderLight">
          <h2 className="font-semibold text-ps-text text-sm">{block.title}</h2>
        </div>
      )}
      <div className="px-6 py-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {sponsors.map((sponsor, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-2 p-3 bg-ps-surface2 rounded-xl border border-ps-borderLight">
              {sponsor.logoUrl ? (
                <img
                  src={sponsor.logoUrl}
                  alt={sponsor.name}
                  className="h-12 object-contain"
                />
              ) : (
                <p className="text-sm font-bold text-ps-text">{sponsor.name}</p>
              )}
              {sponsor.logoUrl && sponsor.name && (
                <p className="text-xs font-semibold text-ps-text">{sponsor.name}</p>
              )}
              {sponsor.websiteUrl && (
                <a
                  href={sponsor.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-ps-accent hover:underline font-medium"
                >
                  Visit website
                </a>
              )}
              {sponsor.blurb && (
                <p className="text-xs text-ps-muted leading-snug">{sponsor.blurb}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CalloutBlock({ block }: { block: ContentBlock }) {
  const items = (block.content.items as CalloutItem[] | undefined) ?? []
  const style = (block.content.style as string | undefined) ?? 'info'
  const visible = items.filter((it) => it.text)
  if (visible.length === 0) return null
  const colorMap: Record<string, string> = {
    info: 'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-amber-50 border-amber-200',
  }
  return (
    <section className={`rounded-3xl border shadow-card px-6 py-5 ${colorMap[style] ?? colorMap.info}`}>
      {block.title && <p className="text-sm font-bold text-ps-text mb-4">{block.title}</p>}
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        {visible.map((it, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className="text-xl shrink-0">{it.icon || '•'}</span>
            <span className="text-sm font-semibold text-ps-text">{it.text}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function VideoBlock({ block }: { block: ContentBlock }) {
  const url = block.content.url as string | undefined
  const caption = block.content.caption as string | undefined
  if (!url) return null

  const ytId = extractYouTubeId(url)
  const vimeoId = extractVimeoId(url)
  const embedSrc = ytId
    ? `https://www.youtube.com/embed/${ytId}`
    : vimeoId
    ? `https://player.vimeo.com/video/${vimeoId}`
    : null

  const title = block.title

  return (
    <section
      style={{ position: 'relative', left: '50%', width: '100vw', marginLeft: '-50vw' }}
      className="bg-gray-950"
    >
      {/* Header */}
      {title && (
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-10 pb-6 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">▶ Watch</p>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{title}</h2>
        </div>
      )}

      {/* Video */}
      <div className={title ? '' : 'pt-10'}>
        {embedSrc ? (
          <div className="max-w-5xl mx-auto px-4 sm:px-8 pb-10">
            <div className="aspect-video overflow-hidden rounded-2xl">
              <iframe
                src={embedSrc}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-center pb-10 px-4">
            <video
              src={url}
              controls
              preload="metadata"
              className="max-h-[82vh] max-w-full block"
            />
          </div>
        )}
      </div>

      {/* Caption */}
      {caption && (
        <p className="text-center text-xs text-white/40 pb-8 -mt-4 px-4">{caption}</p>
      )}
    </section>
  )
}

export default function ContentBlocks({ blocks }: { blocks: ContentBlock[] }) {
  const visible = blocks.filter(hasContent)
  if (visible.length === 0) return null

  return (
    <>
      {visible.map((block) => {
        switch (block.type) {
          case 'text':    return <TextBlock    key={block.id} block={block} />
          case 'callout': return <CalloutBlock key={block.id} block={block} />
          case 'image':   return <ImageBlock   key={block.id} block={block} />
          case 'gallery': return <GalleryBlock key={block.id} block={block} />
          case 'video':   return <VideoBlock   key={block.id} block={block} />
          case 'people':  return <PeopleBlock  key={block.id} block={block} />
          case 'sponsors':return <SponsorsBlock key={block.id} block={block} />
          default:        return null
        }
      })}
    </>
  )
}
