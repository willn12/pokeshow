import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const withUserId = searchParams.get('with')

  if (withUserId) {
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: session.userId, recipientId: withUserId },
          { senderId: withUserId, recipientId: session.userId },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, businessName: true } },
        forumPost: { select: { id: true, content: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
    // Mark as read
    await prisma.directMessage.updateMany({
      where: { senderId: withUserId, recipientId: session.userId, readAt: null },
      data: { readAt: new Date() },
    })
    return NextResponse.json(messages)
  }

  // Get all conversations (latest message per conversation)
  const messages = await prisma.directMessage.findMany({
    where: { OR: [{ senderId: session.userId }, { recipientId: session.userId }] },
    include: {
      sender: { select: { id: true, name: true, businessName: true } },
      recipient: { select: { id: true, name: true, businessName: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Deduplicate to one entry per conversation partner
  const seen = new Set<string>()
  const conversations = messages.filter((m) => {
    const partnerId = m.senderId === session.userId ? m.recipientId : m.senderId
    if (seen.has(partnerId)) return false
    seen.add(partnerId)
    return true
  })

  return NextResponse.json(conversations)
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { recipientId, showId, content, forumPostId } = await req.json()
  if (!recipientId || !showId || !content?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const message = await prisma.directMessage.create({
    data: {
      senderId: session.userId,
      recipientId,
      showId,
      content,
      forumPostId: forumPostId || null,
    },
    include: {
      sender: { select: { id: true, name: true, businessName: true } },
    },
  })
  return NextResponse.json(message, { status: 201 })
}
