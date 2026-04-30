import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import ForumFull from './ForumFull'

export const revalidate = 0

export default async function ForumPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getSession()

  const show = await prisma.show.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true, hostId: true },
  })
  if (!show) notFound()

  let isVendor = false
  if (session) {
    const v = await prisma.showVendor.findUnique({
      where: { showId_userId: { showId: show.id, userId: session.userId } },
    })
    isVendor = v?.status === 'approved'
  }

  return (
    <ForumFull
      showSlug={show.slug}
      showId={show.id}
      showName={show.name}
      showHostId={show.hostId}
      isVendor={isVendor}
      currentUserId={session?.userId}
    />
  )
}
