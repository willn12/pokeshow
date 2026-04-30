import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

// Accept an invite token
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { inviteToken } = await req.json()

  const show = await prisma.show.findUnique({ where: { slug } })
  if (!show) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const vendorRecord = await prisma.showVendor.findFirst({
    where: { inviteToken, showId: show.id, userId: session.userId },
  })
  if (!vendorRecord) return NextResponse.json({ error: 'Invalid invite token' }, { status: 400 })

  const updated = await prisma.showVendor.update({
    where: { id: vendorRecord.id },
    data: { status: 'approved', inviteToken: null },
  })
  return NextResponse.json(updated)
}
