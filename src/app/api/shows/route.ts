import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { slugify } from '@/lib/utils'

export async function GET() {
  const shows = await prisma.show.findMany({
    where: { published: true },
    include: {
      host: { select: { id: true, name: true } },
      _count: { select: { vendors: true, forumPosts: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(shows)
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, location, date, description } = await req.json()
  if (!name || !location) {
    return NextResponse.json({ error: 'Name and location required' }, { status: 400 })
  }

  let slug = slugify(name)
  const existing = await prisma.show.findUnique({ where: { slug } })
  if (existing) slug = `${slug}-${Date.now()}`

  const show = await prisma.show.create({
    data: {
      name,
      location,
      date: date ? new Date(date) : null,
      description,
      slug,
      hostId: session.userId,
      applicationsOpenAt: new Date(),
    },
  })

  return NextResponse.json(show, { status: 201 })
}
