import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const show = await prisma.show.findUnique({
    where: { slug },
    include: {
      host: { select: { id: true, name: true, email: true } },
      vendors: {
        where: { status: 'approved' },
        include: { user: { select: { id: true, name: true, businessName: true, bio: true } } },
      },
    },
  })
  if (!show) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(show)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const show = await prisma.show.findUnique({ where: { slug } })
  if (!show) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (show.hostId !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, location, date, description, flierUrl, vendorMapUrl, theme, bannerUrl, announcementBanner, showCountdown, schedule, logistics, faq } = await req.json()

  const updated = await prisma.show.update({
    where: { slug },
    data: {
      name: name ?? show.name,
      location: location ?? show.location,
      date: date !== undefined ? (date ? new Date(date) : null) : show.date,
      description: description !== undefined ? description : show.description,
      flierUrl: flierUrl !== undefined ? flierUrl : show.flierUrl,
      vendorMapUrl: vendorMapUrl !== undefined ? vendorMapUrl : show.vendorMapUrl,
      ...(theme !== undefined && { theme }),
      ...(bannerUrl !== undefined && { bannerUrl }),
      ...(announcementBanner !== undefined && { announcementBanner }),
      ...(showCountdown !== undefined && { showCountdown }),
      ...(schedule !== undefined && { schedule }),
      ...(logistics !== undefined && { logistics }),
      ...(faq !== undefined && { faq }),
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const show = await prisma.show.findUnique({ where: { slug } })
  if (!show) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (show.hostId !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.show.delete({ where: { slug } })
  return NextResponse.json({ success: true })
}
