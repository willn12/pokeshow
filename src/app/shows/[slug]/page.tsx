import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ShowHero from './ShowHero'
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
      contentBlocks: { orderBy: { sortOrder: 'asc' } },
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

  const vendorUserIds = show.vendors.map((v) => v.userId)
  const inventoryItems = vendorUserIds.length > 0
    ? await prisma.inventoryItem.findMany({
        where: { userId: { in: vendorUserIds } },
        include: { user: { select: { id: true, name: true, businessName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
    : []

  const theme = getTheme(show.theme)
  const schedule = (show.schedule as ScheduleItem[] | null) ?? []
  const faq = (show.faq as FAQItem[] | null) ?? []

  return (
    // Full-width breakout from max-w-6xl mx-auto px-4 py-10 global layout
    <div style={{
      position: 'relative',
      left: '50%',
      width: '100vw',
      marginLeft: '-50vw',
      marginTop: '-2.5rem',
      marginBottom: '-2.5rem',
    }}>

      {/* Announcement banner — full width strip above hero */}
      {show.announcementBanner && (
        <div className="bg-amber-500 border-b border-amber-600">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex items-start gap-3">
            <span className="text-white text-base shrink-0">📢</span>
            <p className="text-sm text-white font-semibold leading-relaxed">{show.announcementBanner}</p>
          </div>
        </div>
      )}

      {/* Hero */}
      <ShowHero
        show={{
          id: show.id,
          slug: show.slug,
          name: show.name,
          location: show.location,
          date: show.date?.toISOString() ?? null,
          description: show.description,
          tagline: show.tagline,
          bannerUrl: show.bannerUrl,
          flierUrl: show.flierUrl,
          showCountdown: show.showCountdown,
          applicationsOpen: show.applicationsOpen,
          hostId: show.hostId,
          host: show.host,
          _count: show._count,
          socialLinks: show.socialLinks as { instagram?: string; twitter?: string; facebook?: string; tiktok?: string; website?: string } | null,
        }}
        heroGradient={theme.heroGradient}
        heroAccent={theme.heroAccent}
        isHost={isHost}
        isVendor={isVendor}
        userId={session?.userId}
        applicationStatus={applicationStatus}
      />

      {/* Main content */}
      <div className="bg-ps-bg">
        <div className="max-w-6xl mx-auto px-4 py-12">
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
            inventoryItems={inventoryItems}
            blocks={show.contentBlocks.map((b) => ({
              id: b.id,
              type: b.type,
              title: b.title,
              content: b.content as Record<string, unknown>,
              sortOrder: b.sortOrder,
            }))}
            ontreasureUsername={show.ontreasureUsername}
          />
        </div>
      </div>

    </div>
  )
}
