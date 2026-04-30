import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import crypto from 'crypto'

// GET all vendors for a show (host sees all statuses, public sees approved only)
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const session = getSessionFromRequest(req)

    const show = await prisma.show.findUnique({ where: { slug } })
    if (!show) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const isHost = session?.userId === show.hostId
    const vendors = await prisma.showVendor.findMany({
      where: { showId: show.id, ...(isHost ? {} : { status: 'approved' }) },
      include: {
        user: { select: { id: true, name: true, businessName: true, bio: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Compute pastShowCount for each vendor: how many OTHER shows by THIS host
    // they've been an approved vendor at
    const vendorIds = vendors.map((v) => v.userId)

    // Fetch all approved vendor records for this host's other shows, for any of these users
    const hostShows = await prisma.show.findMany({
      where: { hostId: show.hostId, id: { not: show.id } },
      select: { id: true },
    })
    const hostShowIds = hostShows.map((s) => s.id)

    let pastShowCountMap: Record<string, number> = {}
    if (hostShowIds.length > 0 && vendorIds.length > 0) {
      const pastVendorships = await prisma.showVendor.groupBy({
        by: ['userId'],
        where: {
          userId: { in: vendorIds },
          showId: { in: hostShowIds },
          status: 'approved',
        },
        _count: { userId: true },
      })
      pastShowCountMap = Object.fromEntries(
        pastVendorships.map((v) => [v.userId, v._count.userId])
      )
    }

    const enrichedVendors = vendors.map((v) => ({
      ...v,
      pastShowCount: pastShowCountMap[v.userId] ?? 0,
    }))

    return NextResponse.json({
      vendors: enrichedVendors,
      show: { createdAt: show.createdAt, applicationsOpenAt: show.applicationsOpenAt },
    })
  } catch (err) {
    console.error('GET /vendors error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: apply as vendor OR host approves/rejects
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const session = getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const show = await prisma.show.findUnique({ where: { slug } })
    if (!show) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()

    // Host updating a vendor status
    if (session.userId === show.hostId && body.vendorId && body.status) {
      const updated = await prisma.showVendor.update({
        where: { id: body.vendorId },
        data: { status: body.status, tableNumber: body.tableNumber },
      })
      return NextResponse.json(updated)
    }

    // Vendor applying to show
    const existing = await prisma.showVendor.findUnique({
      where: { showId_userId: { showId: show.id, userId: session.userId } },
    })
    if (existing) return NextResponse.json({ error: 'Already applied' }, { status: 409 })

    const { inventoryType, estimatedValue, instagramUrl, websiteUrl, applicationNote } = body

    const vendor = await prisma.showVendor.create({
      data: {
        showId: show.id,
        userId: session.userId,
        status: 'pending',
        inventoryType: inventoryType ?? null,
        estimatedValue: estimatedValue != null ? Number(estimatedValue) : null,
        instagramUrl: instagramUrl ?? null,
        websiteUrl: websiteUrl ?? null,
        applicationNote: applicationNote ?? null,
      },
    })
    return NextResponse.json(vendor, { status: 201 })
  } catch (err) {
    console.error('POST /vendors error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Host invite vendor by email
export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const session = getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const show = await prisma.show.findUnique({ where: { slug } })
    if (!show) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (show.hostId !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { email } = await req.json()
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ error: 'No user found with that email' }, { status: 404 })

    const existing = await prisma.showVendor.findUnique({
      where: { showId_userId: { showId: show.id, userId: user.id } },
    })
    if (existing) return NextResponse.json({ error: 'User already in this show' }, { status: 409 })

    const inviteToken = crypto.randomBytes(16).toString('hex')
    const vendor = await prisma.showVendor.create({
      data: { showId: show.id, userId: user.id, status: 'invited', inviteToken },
    })

    // In production, send an email here. For local dev, return the token.
    return NextResponse.json({ vendor, inviteToken, message: `Invite token for ${email}: ${inviteToken}` }, { status: 201 })
  } catch (err) {
    console.error('PUT /vendors error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
