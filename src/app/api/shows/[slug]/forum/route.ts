import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

const PAGE_SIZE = 20
const PREVIEW_SIZE = 5

const userSelect = { id: true, name: true, businessName: true }

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(req.url)

    const tag     = searchParams.get('tag')
    const q       = searchParams.get('q')?.trim()
    const sort    = searchParams.get('sort') ?? 'newest'
    const page    = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const preview = searchParams.get('preview') === 'true'
    const limit   = preview ? PREVIEW_SIZE : PAGE_SIZE

    const session = getSessionFromRequest(req)

    const show = await prisma.show.findUnique({ where: { slug } })
    if (!show) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const where = {
      showId: show.id,
      parentId: null,
      ...(tag && tag !== 'all' ? { tag } : {}),
      ...(q ? { content: { contains: q, mode: 'insensitive' as const } } : {}),
    }

    const [posts, total] = await Promise.all([
      prisma.forumPost.findMany({
        where,
        include: {
          user: { select: userSelect },
          replies: {
            include: { user: { select: userSelect } },
            orderBy: { createdAt: 'asc' },
          },
          _count: { select: { replies: true, votes: true } },
          ...(session ? { votes: { where: { userId: session.userId }, select: { id: true } } } : {}),
        },
        orderBy: sort === 'top'
          ? [{ votes: { _count: 'desc' } }, { createdAt: 'desc' }]
          : { createdAt: 'desc' },
        take: limit,
        skip: preview ? 0 : (page - 1) * PAGE_SIZE,
      }),
      prisma.forumPost.count({ where }),
    ])

    const postsWithVoted = posts.map((p) => {
      const pAny = p as typeof p & { votes?: { id: string }[] }
      return {
        ...p,
        voteCount: p._count.votes,
        voted: session ? (pAny.votes?.length ?? 0) > 0 : false,
        votes: undefined,
      }
    })

    return NextResponse.json({
      posts: postsWithVoted,
      total,
      page,
      pages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    })
  } catch (err) {
    console.error('Forum GET error:', err)
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

    const { content, tag = 'general', parentId } = await req.json()
    if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })

    const validTags = ['general', 'iso', 'question', 'trade', 'price_check']
    const safeTag = validTags.includes(tag) ? tag : 'general'

    const post = await prisma.forumPost.create({
      data: {
        showId: show.id,
        userId: session.userId,
        content,
        tag: parentId ? 'general' : safeTag,
        parentId: parentId || null,
      },
      include: {
        user: { select: userSelect },
        replies: { include: { user: { select: userSelect } } },
        _count: { select: { replies: true, votes: true } },
      },
    })

    return NextResponse.json({ ...post, voteCount: 0, voted: false }, { status: 201 })
  } catch (err) {
    console.error('Forum POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
