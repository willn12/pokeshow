import { prisma } from '@/lib/prisma'
import HomeContent from './HomeContent'

export const revalidate = 0

export default async function HomePage() {
  const shows = await prisma.show.findMany({
    where: { published: true },
    include: {
      host: { select: { name: true } },
      _count: { select: { vendors: true, forumPosts: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return <HomeContent shows={shows} />
}
