import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Calendar, ArrowLeft } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const revalidate = 0

const AVATAR_COLORS = [
  'bg-red-500', 'bg-blue-600', 'bg-emerald-600',
  'bg-amber-500', 'bg-violet-600', 'bg-pink-500',
]

function avatarBg(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, businessName: true, bio: true,
      profileImageUrl: true, instagramHandle: true,
      inventoryItems: { orderBy: { createdAt: 'desc' } },
      vendorShips: {
        where: { status: 'approved' },
        include: { show: { select: { id: true, slug: true, name: true, location: true, date: true, theme: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!user) notFound()

  const displayName = user.businessName || user.name
  const initials = displayName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="max-w-2xl mx-auto">

      <Link href="/" className="inline-flex items-center gap-1.5 text-ps-secondary hover:text-ps-text text-sm font-medium transition-colors mb-8">
        <ArrowLeft size={14} /> Back
      </Link>

      {/* Profile header */}
      <div className="bg-white border border-ps-borderLight rounded-3xl shadow-card overflow-hidden mb-6">
        <div className="p-8">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            {user.profileImageUrl ? (
              <img src={user.profileImageUrl} alt={displayName} className="w-20 h-20 rounded-2xl object-cover border border-ps-borderLight shrink-0" />
            ) : (
              <div className={`w-20 h-20 rounded-2xl ${avatarBg(displayName)} flex items-center justify-center shrink-0`}>
                <span className="text-white font-black text-2xl">{initials}</span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-ps-text leading-tight">{displayName}</h1>
              {user.businessName && user.name !== user.businessName && (
                <p className="text-sm text-ps-secondary mt-0.5">{user.name}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {user.instagramHandle && (
                  <a
                    href={`https://instagram.com/${user.instagramHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg> @{user.instagramHandle}
                  </a>
                )}
                <span className="text-xs text-ps-muted bg-ps-surface2 border border-ps-borderLight px-3 py-1.5 rounded-full">
                  🎴 Card Vendor
                </span>
              </div>
            </div>
          </div>

          {user.bio && (
            <p className="text-sm text-ps-secondary leading-relaxed mt-5 pt-5 border-t border-ps-borderLight">{user.bio}</p>
          )}
        </div>
      </div>

      {/* Inventory showcase */}
      {user.inventoryItems.length > 0 && (
        <div className="bg-white border border-ps-borderLight rounded-3xl shadow-card overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-ps-borderLight">
            <h2 className="font-semibold text-ps-text">Featured Inventory</h2>
            <p className="text-xs text-ps-muted mt-0.5">Cards and items this vendor brings to shows</p>
          </div>
          <div className="p-6 grid grid-cols-3 sm:grid-cols-4 gap-3">
            {user.inventoryItems.map((item) => (
              <div key={item.id} className="aspect-[3/4] rounded-2xl overflow-hidden border border-ps-borderLight shadow-soft bg-ps-surface2 flex items-center justify-center">
                <img src={item.imageUrl} alt={item.caption ?? 'Inventory'} className="w-full h-full object-contain hover:scale-105 transition-transform duration-300 p-1" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shows attended */}
      {user.vendorShips.length > 0 && (
        <div className="bg-white border border-ps-borderLight rounded-3xl shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-ps-borderLight">
            <h2 className="font-semibold text-ps-text">Shows</h2>
            <p className="text-xs text-ps-muted mt-0.5">Card shows this vendor has attended or is attending</p>
          </div>
          <div className="divide-y divide-ps-borderLight">
            {user.vendorShips.map((vs) => (
              <Link key={vs.id} href={`/shows/${vs.show.slug}`} className="flex items-center gap-4 px-6 py-4 hover:bg-ps-surface2 transition-colors group">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-ps-text truncate">{vs.show.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-ps-secondary"><MapPin size={10} className="text-ps-accent" /> {vs.show.location}</span>
                    {vs.show.date && <span className="flex items-center gap-1 text-xs text-ps-secondary"><Calendar size={10} className="text-ps-accent" /> {formatDate(vs.show.date)}</span>}
                  </div>
                </div>
                <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full shrink-0">
                  ✓ Vendor
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
