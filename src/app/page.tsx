import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { MapPin, Calendar, Users, MessageSquare, ArrowRight } from 'lucide-react'

export const revalidate = 0

export default async function HomePage() {
  const shows = await prisma.show.findMany({
    where: { published: true },
    include: {
      host: { select: { name: true } },
      _count: { select: { vendors: true, forumPosts: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      {/* Hero */}
      <section className="text-center py-20 mb-16">
        <div className="inline-flex items-center gap-2 bg-ps-accentLight text-ps-accent text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
          Pokemon Card Shows
        </div>
        <h1 className="text-6xl font-bold tracking-tight mb-5 text-balance leading-tight">
          Find shows.<br />Meet vendors.<br />
          <span className="text-ps-accent">Get the cards you want.</span>
        </h1>
        <p className="text-ps-secondary text-lg max-w-lg mx-auto mb-10 leading-relaxed">
          Post exactly what you&apos;re looking for and what you&apos;ll pay — vendors at the show will find you.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/auth/register"
            className="flex items-center gap-2 bg-ps-accent hover:bg-ps-accentHover text-white px-6 py-3 rounded-full font-semibold transition-colors text-sm"
          >
            Get started <ArrowRight size={15} />
          </Link>
          <Link
            href="#shows"
            className="flex items-center gap-2 bg-white hover:bg-ps-surface2 text-ps-text px-6 py-3 rounded-full font-semibold transition-colors text-sm shadow-soft border border-ps-borderLight"
          >
            Browse shows
          </Link>
        </div>
      </section>

      {/* Shows grid */}
      <section id="shows">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Upcoming Shows</h2>
          <Link href="/shows/new" className="text-sm text-ps-accent hover:text-ps-accentHover font-medium transition-colors">
            Host a show →
          </Link>
        </div>

        {shows.length === 0 ? (
          <div className="bg-white rounded-3xl border border-ps-borderLight p-16 text-center shadow-card">
            <div className="text-5xl mb-4">🎴</div>
            <p className="text-ps-secondary text-lg mb-2 font-medium">No shows yet</p>
            <p className="text-ps-muted text-sm mb-6">Be the first to host a Pokemon card show.</p>
            <Link href="/shows/new" className="inline-flex items-center gap-2 bg-ps-accent hover:bg-ps-accentHover text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors">
              Host the first one <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {shows.map((show) => (
              <Link key={show.id} href={`/shows/${show.slug}`}>
                <div className="bg-white border border-ps-borderLight rounded-3xl overflow-hidden hover:shadow-card-hover transition-all duration-300 group cursor-pointer">
                  {show.flierUrl ? (
                    <img src={show.flierUrl} alt={show.name} className="w-full h-52 object-cover" />
                  ) : (
                    <div className="w-full h-52 bg-gradient-to-br from-red-50 to-ps-surface2 flex items-center justify-center">
                      <span className="text-5xl opacity-60">🎴</span>
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="font-semibold text-lg tracking-tight group-hover:text-ps-accent transition-colors mb-2">{show.name}</h3>
                    <div className="flex items-center gap-1.5 text-ps-secondary text-sm mb-1">
                      <MapPin size={13} className="shrink-0" />
                      <span>{show.location}</span>
                    </div>
                    {show.date && (
                      <div className="flex items-center gap-1.5 text-ps-secondary text-sm mb-4">
                        <Calendar size={13} className="shrink-0" />
                        <span>{formatDate(show.date)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-sm text-ps-muted pt-4 border-t border-ps-borderLight">
                      <span className="flex items-center gap-1.5"><Users size={13} /> {show._count.vendors} vendors</span>
                      <span className="flex items-center gap-1.5"><MessageSquare size={13} /> {show._count.forumPosts} posts</span>
                      <span className="ml-auto text-xs">by {show.host.name}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
