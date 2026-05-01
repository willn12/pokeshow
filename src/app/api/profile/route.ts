import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, getSessionFromRequest } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true, name: true, email: true, businessName: true, bio: true,
      profileImageUrl: true, instagramHandle: true,
      inventoryItems: { orderBy: { createdAt: 'desc' } },
    },
  })
  return NextResponse.json(user)
}

export async function PUT(req: NextRequest) {
  const session = getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, businessName, bio, instagramHandle, profileImageUrl } = await req.json()

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: {
      ...(name !== undefined && { name }),
      ...(businessName !== undefined && { businessName }),
      ...(bio !== undefined && { bio }),
      ...(instagramHandle !== undefined && { instagramHandle: instagramHandle || null }),
      ...(profileImageUrl !== undefined && { profileImageUrl: profileImageUrl || null }),
    },
    select: {
      id: true, name: true, email: true, businessName: true, bio: true,
      profileImageUrl: true, instagramHandle: true,
    },
  })
  return NextResponse.json(user)
}
