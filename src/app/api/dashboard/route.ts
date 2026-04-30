import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.userId

  const [hostedShows, applications] = await Promise.all([
    prisma.show.findMany({
      where: { hostId: userId },
      include: {
        _count: { select: { vendors: true, forumPosts: true } },
        vendors: {
          where: { status: 'pending' },
          select: { id: true },
        },
      },
      orderBy: { date: 'asc' },
    }),
    prisma.showVendor.findMany({
      where: { userId },
      include: {
        show: {
          select: {
            id: true, slug: true, name: true, location: true,
            date: true, theme: true, flierUrl: true,
            host: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return NextResponse.json({ hostedShows, applications })
}
