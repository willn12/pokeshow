import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { sendBlastEmails } from '@/lib/email'

type BlastGroup = 'approved' | 'confirmed' | 'active' | 'pending' | 'all'

const GROUP_STATUSES: Record<BlastGroup, string[]> = {
  approved:  ['approved'],
  confirmed: ['confirmed'],
  active:    ['approved', 'confirmed'],
  pending:   ['pending'],
  all:       ['pending', 'approved', 'confirmed', 'invited'],
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const session = getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const show = await prisma.show.findUnique({
      where: { slug },
      include: { host: { select: { id: true, name: true, email: true } } },
    })
    if (!show) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (show.hostId !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { group, subject, message } = await req.json() as {
      group: BlastGroup
      subject: string
      message: string
    }

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
    }

    const statuses = GROUP_STATUSES[group] ?? GROUP_STATUSES.active

    const vendors = await prisma.showVendor.findMany({
      where: { showId: show.id, status: { in: statuses } },
      include: { user: { select: { email: true, name: true, businessName: true } } },
    })

    if (vendors.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No recipients in this group' })
    }

    const recipients = vendors.map((v) => ({
      to: v.user.email,
      vendorName: v.user.businessName || v.user.name,
    }))

    const sent = await sendBlastEmails(recipients, {
      showName: show.name,
      showSlug: show.slug,
      subject: subject.trim(),
      message: message.trim(),
      hostName: show.host.name,
      hostEmail: show.host.email,
    })

    return NextResponse.json({ sent })
  } catch (err) {
    console.error('POST /blast error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
