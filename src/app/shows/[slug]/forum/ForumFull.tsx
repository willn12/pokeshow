'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { getSocket } from '@/lib/socket'
import { Plus, Search, ArrowLeft, X, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import { PostCard, ComposeForm, type Post } from '@/components/Forum'

type Tag = 'all' | 'iso' | 'question' | 'trade' | 'price_check' | 'general'
type Sort = 'newest' | 'top'

const TAGS: { id: Tag; label: string; icon: string; color: string; bg: string; border: string }[] = [
  { id: 'all',         label: 'All',         icon: '☰',  color: 'text-ps-secondary', bg: 'bg-ps-surface2', border: 'border-ps-border' },
  { id: 'iso',         label: 'ISO',         icon: '🔍', color: 'text-blue-600',     bg: 'bg-blue-50',     border: 'border-blue-200' },
  { id: 'question',    label: 'Host Q&A',    icon: '❓', color: 'text-violet-600',   bg: 'bg-violet-50',   border: 'border-violet-200' },
  { id: 'trade',       label: 'For Trade',   icon: '🔄', color: 'text-green-600',    bg: 'bg-green-50',    border: 'border-green-200' },
  { id: 'price_check', label: 'Price Check', icon: '💰', color: 'text-amber-600',    bg: 'bg-amber-50',    border: 'border-amber-200' },
  { id: 'general',     label: 'General',     icon: '💬', color: 'text-ps-secondary', bg: 'bg-ps-surface2', border: 'border-ps-border' },
]

function PostSkeleton() {
  return (
    <div className="bg-white border border-ps-borderLight rounded-2xl p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-6 h-16 rounded-xl bg-ps-surface2 shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-ps-surface2" />
            <div className="h-3 bg-ps-surface2 rounded w-24" />
          </div>
          <div className="h-3 bg-ps-surface2 rounded w-3/4" />
          <div className="h-3 bg-ps-surface2 rounded w-1/2" />
        </div>
      </div>
    </div>
  )
}

interface Props {
  showSlug: string
  showId: string
  showName: string
  showHostId: string
  isVendor: boolean
  currentUserId?: string
}

export default function ForumFull({ showSlug, showId, showName, showHostId, isVendor, currentUserId }: Props) {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [activeTag, setActiveTag] = useState<Tag>('all')
  const [sort, setSort] = useState<Sort>('newest')
  const [searchInput, setSearchInput] = useState('')
  const [q, setQ] = useState('')
  const [composing, setComposing] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setQ(searchInput.trim()), 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchInput])

  const buildParams = useCallback((pg: number) => {
    const p = new URLSearchParams()
    if (activeTag !== 'all') p.set('tag', activeTag)
    if (sort !== 'newest') p.set('sort', sort)
    if (q) p.set('q', q)
    p.set('page', String(pg))
    return p.toString()
  }, [activeTag, sort, q])

  // Initial / filter load — resets list
  useEffect(() => {
    setLoading(true)
    setPage(1)
    fetch(`/api/shows/${showSlug}/forum?${buildParams(1)}`)
      .then((r) => r.json())
      .then((data) => {
        setPosts(data.posts ?? [])
        setTotal(data.total ?? 0)
        setHasMore(data.hasMore ?? false)
      })
      .catch(() => {
        setPosts([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [showSlug, activeTag, sort, q]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load more
  async function loadMore() {
    const nextPage = page + 1
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/shows/${showSlug}/forum?${buildParams(nextPage)}`)
      const data = await res.json()
      setPosts((prev) => [...prev, ...(data.posts ?? [])])
      setPage(nextPage)
      setHasMore(data.hasMore ?? false)
    } finally {
      setLoadingMore(false)
    }
  }

  // Real-time socket
  useEffect(() => {
    const socket = getSocket()
    socket.emit('join-show', showId)
    socket.on('new-forum-post', (post: Post) => {
      if (sort === 'newest' && !q && (activeTag === 'all' || activeTag === post.tag)) {
        setPosts((prev) => [post, ...prev])
        setTotal((t) => t + 1)
      }
    })
    socket.on('new-forum-reply', ({ reply, parentId }: { reply: unknown; parentId: string }) => {
      setPosts((prev) => prev.map((p) =>
        p.id === parentId
          ? { ...p, replies: [...p.replies, reply as Post['replies'][number]], _count: { replies: p._count.replies + 1 } }
          : p
      ))
    })
    return () => {
      socket.off('new-forum-post')
      socket.off('new-forum-reply')
    }
  }, [showId, activeTag, sort, q])

  return (
    <div className="max-w-2xl mx-auto">
      {/* Top nav */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/shows/${showSlug}`}
          className="flex items-center gap-1.5 text-sm text-ps-secondary hover:text-ps-text transition-colors font-medium"
        >
          <ArrowLeft size={15} /> {showName}
        </Link>
      </div>

      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ps-text">Community Board</h1>
          <p className="text-ps-secondary text-sm mt-0.5">
            {total > 0 ? `${total} post${total === 1 ? '' : 's'}` : 'No posts yet'}
            {q && <span className="text-ps-muted"> matching &ldquo;{q}&rdquo;</span>}
          </p>
        </div>
        {user ? (
          <button
            onClick={() => setComposing(true)}
            className="flex items-center gap-1.5 bg-ps-accent hover:bg-ps-accentHover text-white text-sm font-medium px-4 py-2 rounded-full transition-colors shrink-0"
          >
            <Plus size={14} /> New Post
          </button>
        ) : (
          <a
            href="/auth/register"
            className="flex items-center gap-1.5 bg-ps-accent hover:bg-ps-accentHover text-white text-sm font-medium px-4 py-2 rounded-full transition-colors shrink-0"
          >
            <Plus size={14} /> Join to Post
          </a>
        )}
      </div>

      {/* Search + Sort */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ps-muted" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search posts…"
            className="w-full pl-9 pr-8 py-2.5 bg-white border border-ps-border rounded-xl text-sm text-ps-text placeholder:text-ps-muted focus:outline-none focus:border-ps-accent focus:ring-2 focus:ring-ps-accentLight transition-all"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ps-muted hover:text-ps-text"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Sort toggle */}
        <div className="flex bg-white border border-ps-border rounded-xl overflow-hidden shrink-0">
          {(['newest', 'top'] as Sort[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium transition-colors ${
                sort === s
                  ? 'bg-ps-accent text-white'
                  : 'text-ps-secondary hover:text-ps-text'
              }`}
            >
              {s === 'newest' ? '🕐' : '🔥'} {s === 'newest' ? 'New' : 'Top'}
            </button>
          ))}
        </div>
      </div>

      {/* Tag filter */}
      <div className="flex gap-1.5 flex-wrap mb-5 pb-4 border-b border-ps-borderLight">
        {TAGS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTag(t.id)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
              activeTag === t.id
                ? `${t.color} ${t.bg} ${t.border} shadow-soft`
                : 'text-ps-muted bg-white border-ps-border hover:border-ps-accent hover:text-ps-accent'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <PostSkeleton key={i} />)}</div>
      ) : posts.length === 0 ? (
        <div className="bg-white border border-ps-borderLight rounded-3xl p-12 text-center">
          <div className="text-3xl mb-3">🎴</div>
          <p className="text-ps-secondary font-medium text-sm">
            {q ? `No posts matching "${q}"` : 'No posts yet'}
          </p>
          <p className="text-ps-muted text-xs mt-1">
            {user ? 'Be the first to post!' : 'Sign in to start the conversation.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              showSlug={showSlug}
              showId={showId}
              showHostId={showHostId}
              isVendor={isVendor}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && !loading && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="mt-5 w-full py-3 rounded-2xl border border-ps-borderLight bg-white hover:border-ps-accent hover:text-ps-accent text-ps-secondary text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loadingMore ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-ps-border border-t-ps-accent rounded-full animate-spin" />
              Loading…
            </span>
          ) : (
            <>
              <SlidersHorizontal size={13} /> Load more posts
            </>
          )}
        </button>
      )}

      {/* Compose modal */}
      {composing && (
        <ComposeForm
          showSlug={showSlug}
          showId={showId}
          initialTag={activeTag === 'all' ? 'general' : activeTag}
          onClose={() => setComposing(false)}
        />
      )}
    </div>
  )
}
