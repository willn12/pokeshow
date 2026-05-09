import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import ApplicationForm from './ApplicationForm'

export const revalidate = 0

export default async function ApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getSession()

  if (!session) {
    redirect(`/auth/login?redirect=/shows/${slug}/apply`)
  }

  const show = await prisma.show.findUnique({ where: { slug } })
  if (!show) notFound()

  const existingRecord = await prisma.showVendor.findUnique({
    where: { showId_userId: { showId: show.id, userId: session.userId } },
  })

  if (existingRecord?.status === 'approved') {
    redirect(`/shows/${slug}`)
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, businessName: true, email: true },
  })

  if (!user) redirect('/auth/login')

  const tiers = await prisma.tableTier.findMany({
    where: { showId: show.id },
    orderBy: { sortOrder: 'asc' },
  })

  if (existingRecord && (existingRecord.status === 'pending' || existingRecord.status === 'rejected')) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4 ${
          existingRecord.status === 'pending'
            ? 'bg-amber-50 border border-amber-200 text-amber-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {existingRecord.status === 'pending' ? '⏳ Application Pending' : '✗ Application Not Accepted'}
        </div>
        <h1 className="text-2xl font-bold text-ps-text mb-2">{show.name}</h1>
        <p className="text-ps-secondary text-sm mb-6">
          {existingRecord.status === 'pending'
            ? 'Your application is under review. The organizer will be in touch.'
            : 'Unfortunately your application was not accepted for this show.'}
        </p>
        <a
          href={`/shows/${slug}`}
          className="inline-flex items-center gap-2 text-ps-accent hover:text-ps-accentHover font-medium text-sm transition-colors"
        >
          ← Back to show
        </a>
      </div>
    )
  }

  return (
    <ApplicationForm
      show={{
        slug: show.slug,
        name: show.name,
        location: show.location,
        date: show.date ? show.date.toISOString() : null,
      }}
      user={user}
      tiers={tiers.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        price: t.price,
        quantity: t.quantity,
        color: t.color,
      }))}
    />
  )
}
