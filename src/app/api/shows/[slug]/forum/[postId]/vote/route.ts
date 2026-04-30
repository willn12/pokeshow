import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  const { postId } = await params
  const session = getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await prisma.forumVote.findUnique({
    where: { postId_userId: { postId, userId: session.userId } },
  })

  if (existing) {
    await prisma.forumVote.delete({ where: { id: existing.id } })
    const count = await prisma.forumVote.count({ where: { postId } })
    return NextResponse.json({ voted: false, voteCount: count })
  }

  await prisma.forumVote.create({ data: { postId, userId: session.userId } })
  const count = await prisma.forumVote.count({ where: { postId } })
  return NextResponse.json({ voted: true, voteCount: count })
}
