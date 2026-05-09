import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

async function resolveShow(slug: string) {
  return prisma.show.findUnique({ where: { slug } })
}

// GET — public, returns all blocks ordered by sortOrder
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const show = await resolveShow(slug)
    if (!show) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const blocks = await prisma.contentBlock.findMany({
      where: { showId: show.id },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json(blocks)
  } catch (err) {
    console.error('GET /blocks error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — create new block
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const session = getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const show = await resolveShow(slug)
    if (!show) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (show.hostId !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { type, title, content, sortOrder } = await req.json()
    const block = await prisma.contentBlock.create({
      data: { showId: show.id, type, title: title ?? null, content: content ?? {}, sortOrder: sortOrder ?? 0 },
    })
    return NextResponse.json(block, { status: 201 })
  } catch (err) {
    console.error('POST /blocks error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT — update a block OR batch-reorder
export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const session = getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const show = await resolveShow(slug)
    if (!show) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (show.hostId !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()

    // Reorder: body = { order: [{id, sortOrder}] }
    if (body.order) {
      await Promise.all(
        body.order.map(({ id, sortOrder }: { id: string; sortOrder: number }) =>
          prisma.contentBlock.update({ where: { id }, data: { sortOrder } })
        )
      )
      return NextResponse.json({ ok: true })
    }

    // Single update: body = { id, title?, content? }
    const { id, title, content } = body
    const updated = await prisma.contentBlock.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title || null }),
        ...(content !== undefined && { content }),
      },
    })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('PUT /blocks error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE — delete a block by id in query string
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const session = getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const show = await resolveShow(slug)
    if (!show) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (show.hostId !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    await prisma.contentBlock.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /blocks error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
