import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const show = await prisma.show.findUnique({ where: { slug } })
    if (!show) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const tiers = await prisma.tableTier.findMany({
      where: { showId: show.id },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { vendors: { where: { status: 'approved' } } } },
      },
    })

    return NextResponse.json({ tiers })
  } catch (err) {
    console.error('GET /tiers error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const session = getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const show = await prisma.show.findUnique({ where: { slug } })
    if (!show) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (show.hostId !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()

    // Delete tier
    if (body.action === 'delete' && body.tierId) {
      await prisma.tableTier.delete({ where: { id: body.tierId } })
      return NextResponse.json({ ok: true })
    }

    // Update tier
    if (body.action === 'update' && body.tierId) {
      const tier = await prisma.tableTier.update({
        where: { id: body.tierId },
        data: {
          name: body.name,
          description: body.description ?? null,
          price: Number(body.price) || 0,
          quantity: Number(body.quantity) || 0,
          color: body.color ?? 'gray',
          sortOrder: Number(body.sortOrder) || 0,
        },
      })
      return NextResponse.json({ tier })
    }

    // Create tier
    const existingCount = await prisma.tableTier.count({ where: { showId: show.id } })
    const tier = await prisma.tableTier.create({
      data: {
        showId: show.id,
        name: body.name,
        description: body.description ?? null,
        price: Number(body.price) || 0,
        quantity: Number(body.quantity) || 0,
        color: body.color ?? 'gray',
        sortOrder: existingCount,
      },
    })
    return NextResponse.json({ tier }, { status: 201 })
  } catch (err) {
    console.error('POST /tiers error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
