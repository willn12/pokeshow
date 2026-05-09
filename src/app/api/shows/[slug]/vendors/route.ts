import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { sendApprovalEmail, sendRejectionEmail, sendConfirmationEmail, sendApplicationReceivedEmail, sendInviteEmail } from '@/lib/email'
import crypto from 'crypto'

// GET all vendors for a show (host sees all statuses, public sees approved only)
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const session = getSessionFromRequest(req)

    const show = await prisma.show.findUnique({ where: { slug } })
    if (!show) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const isHost = session?.userId === show.hostId
    const [vendors, hostShows, tiers] = await Promise.all([
      prisma.showVendor.findMany({
        where: { showId: show.id, ...(isHost ? {} : { status: { in: ['approved', 'confirmed'] } }) },
        include: {
          user: { select: { id: true, name: true, businessName: true, bio: true, email: true } },
          tableTier: { select: { id: true, name: true, color: true, price: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.show.findMany({
        where: { hostId: show.hostId, id: { not: show.id } },
        select: { id: true },
      }),
      prisma.tableTier.findMany({
        where: { showId: show.id },
        orderBy: { sortOrder: 'asc' },
      }),
    ])

    const vendorIds = vendors.map((v) => v.userId)
    const hostShowIds = hostShows.map((s) => s.id)

    let pastShowCountMap: Record<string, number> = {}
    if (hostShowIds.length > 0 && vendorIds.length > 0) {
      const pastVendorships = await prisma.showVendor.groupBy({
        by: ['userId'],
        where: {
          userId: { in: vendorIds },
          showId: { in: hostShowIds },
          status: { in: ['approved', 'confirmed'] },
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
      tiers,
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
      const updateData: Record<string, unknown> = { status: body.status }
      if (body.tableNumber !== undefined) updateData.tableNumber = body.tableNumber || null
      if (body.tableTierId !== undefined) updateData.tableTierId = body.tableTierId || null
      if (body.approvedQuantity !== undefined) updateData.approvedQuantity = body.approvedQuantity ? Number(body.approvedQuantity) : null
      const updated = await prisma.showVendor.update({
        where: { id: body.vendorId },
        data: updateData,
        include: {
          user: { select: { email: true, name: true, businessName: true } },
          tableTier: { select: { name: true, price: true } },
        },
      })

      const emailStatus = body.status as string
      const vendorName = updated.user.businessName || updated.user.name
      const approvedQty = updated.approvedQuantity ?? updated.requestedQuantity
      const totalPrice = updated.tableTier ? updated.tableTier.price * approvedQty : 0
      if (emailStatus === 'approved') {
        sendApprovalEmail({
          to: updated.user.email,
          vendorName,
          showName: show.name,
          showDate: show.date?.toISOString() ?? null,
          showLocation: show.location,
          showSlug: show.slug,
          tierName: updated.tableTier?.name ?? null,
          quantity: approvedQty,
          tableNumber: updated.tableNumber,
          totalPrice,
          venmoHandle: show.venmoHandle ?? null,
        }).catch(console.error)
      } else if (emailStatus === 'rejected') {
        sendRejectionEmail({
          to: updated.user.email,
          vendorName,
          showName: show.name,
          showSlug: show.slug,
        }).catch(console.error)
      } else if (emailStatus === 'confirmed') {
        sendConfirmationEmail({
          to: updated.user.email,
          vendorName,
          showName: show.name,
          showDate: show.date?.toISOString() ?? null,
          showLocation: show.location,
          showSlug: show.slug,
          tierName: updated.tableTier?.name ?? null,
          quantity: approvedQty,
          tableNumber: updated.tableNumber,
        }).catch(console.error)
      }

      return NextResponse.json(updated)
    }

    // Vendor applying to show
    const existing = await prisma.showVendor.findUnique({
      where: { showId_userId: { showId: show.id, userId: session.userId } },
    })
    if (existing) return NextResponse.json({ error: 'Already applied' }, { status: 409 })

    const { inventoryTypes, requestedQuantity, estimatedValue, instagramUrl, websiteUrl, applicationNote, tableTierId } = body

    const appliedQty = requestedQuantity ? Math.max(1, Number(requestedQuantity)) : 1
    const vendor = await prisma.showVendor.create({
      data: {
        showId: show.id,
        userId: session.userId,
        status: 'pending',
        inventoryTypes: Array.isArray(inventoryTypes) ? inventoryTypes : [],
        requestedQuantity: appliedQty,
        estimatedValue: estimatedValue != null ? Number(estimatedValue) : null,
        instagramUrl: instagramUrl ?? null,
        websiteUrl: websiteUrl ?? null,
        applicationNote: applicationNote ?? null,
        tableTierId: tableTierId ?? null,
      },
      include: {
        user: { select: { email: true, name: true, businessName: true } },
        tableTier: { select: { name: true } },
      },
    })

    const vendorName = vendor.user.businessName || vendor.user.name
    sendApplicationReceivedEmail({
      to: vendor.user.email,
      vendorName,
      showName: show.name,
      showDate: show.date?.toISOString() ?? null,
      showLocation: show.location,
      showSlug: show.slug,
      tierName: vendor.tableTier?.name ?? null,
      requestedQuantity: appliedQty,
    }).catch(console.error)

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

    const show = await prisma.show.findUnique({
      where: { slug },
      include: { host: { select: { name: true, businessName: true } } },
    })
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

    const hostName = show.host?.businessName || show.host?.name || 'Show Host'
    const vendorName = user.businessName || user.name
    sendInviteEmail({
      to: user.email,
      vendorName,
      showName: show.name,
      showDate: show.date?.toISOString() ?? null,
      showLocation: show.location,
      showSlug: show.slug,
      hostName,
      inviteToken,
    }).catch(console.error)

    return NextResponse.json({ vendor, message: `Invite sent to ${email}` }, { status: 201 })
  } catch (err) {
    console.error('PUT /vendors error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
