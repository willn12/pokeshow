'use client'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { getSocket } from '@/lib/socket'
import { timeAgo } from '@/lib/utils'
import { Plus, Send, MessageCircle, X, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import DMModal from './DMModal'

// ── Types ──────────────────────────────────────────────────

type Tag = 'all' | 'iso' | 'question' | 'trade' | 'price_check' | 'general'

interface Reply {
  id: string
  content: string
  createdAt: string
  user: { id: string; name: string; businessName: string | null }
}

export interface Post {
  id: string
  content: string
  tag: string
  createdAt: string
  voteCount: number
  voted: boolean
  user: { id: string; name: string; businessName: string | null }
  replies: Reply[]
  _count: { replies: number }
}

interface Props {
  showSlug: string
  showId: string
  showHostId: string
  isVendor: boolean
  currentUserId?: string
  preview?: boolean  // true = show 5 posts + link to full forum
}

// ── Tag config ─────────────────────────────────────────────

const TAGS: { id: Tag; label: string; icon: string; color: string; bg: string; border: string }[] = [
  { id: 'all',         label: 'All',          icon: '☰',  color: 'text-ps-secondary', bg: 'bg-ps-surface2',   border: 'border-ps-border' },
  { id: 'iso',         label: 'ISO',          icon: '🔍', color: 'text-blue-600',     bg: 'bg-blue-50',       border: 'border-blue-200' },
  { id: 'question',    label: 'Host Q&A',     icon: '❓', color: 'text-violet-600',   bg: 'bg-violet-50',     border: 'border-violet-200' },
  { id: 'trade',       label: 'For Trade',    icon: '🔄', color: 'text-green-600',    bg: 'bg-green-50',      border: 'border-green-200' },
  { id: 'price_check', label: 'Price Check',  icon: '💰', color: 'text-amber-600',    bg: 'bg-amber-50',      border: 'border-amber-200' },
  { id: 'general',     label: 'General',      icon: '💬', color: 'text-ps-secondary', bg: 'bg-ps-surface2',   border: 'border-ps-border' },
]

function tagConfig(tag: string) {
  return TAGS.find((t) => t.id === tag) ?? TAGS[TAGS.length - 1]
}

function TagBadge({ tag }: { tag: string }) {
  const cfg = tagConfig(tag)
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-ps-accentLight text-ps-accent text-sm font-bold flex items-center justify-center shrink-0">
      {name[0]?.toUpperCase()}
    </div>
  )
}

const TAG_META: Record<string, { description: string; placeholder: string }> = {
  iso:         { description: 'Looking to buy a specific card',      placeholder: 'e.g. Looking for 1st Ed. Charizard, paying up to $200…' },
  question:    { description: 'Ask the show host something',          placeholder: 'e.g. Will you have graded slabs available at the show?' },
  trade:       { description: 'Offer a card you want to trade',       placeholder: 'e.g. I have a PSA 9 Blastoise, looking for a Venusaur of similar grade…' },
  price_check: { description: 'Get a fair market read from the crowd', placeholder: 'e.g. What\'s a fair price for a LP Shadowless Base Set Charizard?' },
  general:     { description: 'Anything else — hype, tips, chat',     placeholder: 'Share something with the community…' },
}

// ── Compose form ───────────────────────────────────────────

export function ComposeForm({
  showSlug, showId, initialTag = 'general', onClose, onPost,
}: {
  showSlug: string; showId: string; initialTag?: Tag; onClose: () => void; onPost?: (post: Post) => void
}) {
  const [content, setContent] = useState('')
  const [tag, setTag] = useState<Tag>(initialTag === 'all' ? 'general' : initialTag)
  const [submitting, setSubmitting] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/shows/${showSlug}/forum`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, tag }),
      })
      if (res.ok) {
        const post = await res.json()
        onPost?.(post)
        getSocket().emit('forum-post', { ...post, showId })
        onClose()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const activeCfg = tagConfig(tag)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl shadow-card-hover w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ps-borderLight">
          <span className="font-semibold text-ps-text">New Post</span>
          <button type="button" onClick={onClose} className="text-ps-muted hover:text-ps-text transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tag picker */}
        <div className="px-5 pt-4 pb-2">
          <p className="text-xs font-semibold text-ps-muted uppercase tracking-wide mb-2">Post type</p>
          <div className="grid grid-cols-1 gap-1.5">
            {TAGS.filter((t) => t.id !== 'all').map((t) => {
              const meta = TAG_META[t.id]
              const isSelected = tag === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTag(t.id as Tag)}
                  className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl border transition-all ${
                    isSelected
                      ? `${t.bg} ${t.border} ${t.color}`
                      : 'bg-ps-surface2 border-transparent hover:border-ps-border text-ps-secondary'
                  }`}
                >
                  <span className="text-base w-5 text-center shrink-0">{t.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold block">{t.label}</span>
                    <span className="text-xs opacity-70 block">{meta.description}</span>
                  </div>
                  {isSelected && <span className={`text-xs font-bold shrink-0 ${t.color}`}>✓</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Textarea + submit */}
        <form onSubmit={submit} className="px-5 py-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={TAG_META[tag]?.placeholder}
            rows={3}
            className={`w-full bg-ps-surface2 border rounded-xl px-3.5 py-2.5 text-sm text-ps-text placeholder:text-ps-muted focus:outline-none focus:ring-2 transition-all resize-none mb-3 ${activeCfg.border} focus:ring-ps-accentLight`}
            autoFocus
          />
          <div className="flex items-center justify-between">
            <span className={`flex items-center gap-1.5 text-xs font-semibold ${activeCfg.color}`}>
              {activeCfg.icon} {activeCfg.label}
            </span>
            <div className="flex gap-2">
              <button type="button" onClick={onClose}
                className="text-sm px-4 py-2 rounded-xl bg-ps-surface2 hover:bg-ps-border text-ps-secondary transition-colors font-medium">
                Cancel
              </button>
              <button type="submit" disabled={submitting || !content.trim()}
                className="text-sm px-4 py-2 rounded-xl bg-ps-accent hover:bg-ps-accentHover disabled:opacity-40 text-white font-medium transition-colors flex items-center gap-1.5">
                <Send size={13} /> Post
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Reply form ─────────────────────────────────────────────

function ReplyForm({
  showSlug, showId, parentId, onClose,
}: {
  showSlug: string; showId: string; parentId: string; onClose: () => void
}) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/shows/${showSlug}/forum`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parentId }),
      })
      if (res.ok) {
        const reply = await res.json()
        getSocket().emit('forum-reply', { ...reply, showId, parentId })
        onClose()
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-2 flex gap-2">
      <input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a reply…"
        className="flex-1 bg-ps-surface2 border border-ps-border rounded-xl px-3.5 py-2 text-sm text-ps-text placeholder:text-ps-muted focus:outline-none focus:border-ps-accent focus:ring-2 focus:ring-ps-accentLight transition-all"
        autoFocus
      />
      <button type="submit" disabled={submitting || !content.trim()}
        className="bg-ps-accent hover:bg-ps-accentHover disabled:opacity-40 text-white px-3 py-2 rounded-xl transition-colors">
        <Send size={13} />
      </button>
      <button type="button" onClick={onClose} className="text-ps-muted hover:text-ps-text px-2">
        <X size={15} />
      </button>
    </form>
  )
}

// ── PostCard ───────────────────────────────────────────────

export function PostCard({
  post, showSlug, showId, showHostId, isVendor, currentUserId,
}: {
  post: Post; showSlug: string; showId: string; showHostId: string
  isVendor: boolean; currentUserId?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [replying, setReplying] = useState(false)
  const [dmTarget, setDmTarget] = useState<{ userId: string; name: string } | null>(null)
  const [voteCount, setVoteCount] = useState(post.voteCount)
  const [voted, setVoted] = useState(post.voted)
  const replyCount = post._count.replies

  async function handleVote() {
    if (!currentUserId) return
    const res = await fetch(`/api/shows/${showSlug}/forum/${post.id}/vote`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setVoteCount(data.voteCount)
      setVoted(data.voted)
    }
  }

  return (
    <div className="bg-white border border-ps-borderLight rounded-2xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Upvote column */}
          <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
            <button
              onClick={handleVote}
              disabled={!currentUserId}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all ${
                voted
                  ? 'bg-ps-accentLight text-ps-accent'
                  : currentUserId
                    ? 'text-ps-muted hover:bg-ps-surface2 hover:text-ps-accent'
                    : 'text-ps-muted cursor-default'
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill={voted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              <span className="text-xs font-semibold leading-none">{voteCount}</span>
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Avatar name={post.user.name} />
              <span className="font-semibold text-sm text-ps-text">
                {post.user.businessName || post.user.name}
              </span>
              {post.user.businessName && (
                <span className="text-xs bg-ps-accentLight text-ps-accent px-1.5 py-0.5 rounded-full font-medium">Vendor</span>
              )}
              {post.user.id === showHostId && (
                <span className="text-xs bg-violet-50 text-violet-600 border border-violet-200 px-1.5 py-0.5 rounded-full font-medium">Host</span>
              )}
              <span className="text-xs text-ps-muted ml-auto">{timeAgo(post.createdAt)}</span>
            </div>
            <div className="ml-10">
              <TagBadge tag={post.tag} />
              <p className="text-ps-text text-sm leading-relaxed mt-2">{post.content}</p>
            </div>
          </div>
        </div>

        {/* Action row */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-ps-borderLight ml-11">
          {currentUserId && (
            <button
              onClick={() => setReplying(!replying)}
              className="flex items-center gap-1 text-xs text-ps-secondary hover:text-ps-accent font-medium transition-colors"
            >
              <MessageCircle size={13} /> Reply
            </button>
          )}
          {replyCount > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-ps-secondary hover:text-ps-accent font-medium transition-colors"
            >
              {expanded ? '▲' : '▼'} {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
            </button>
          )}
          {isVendor && currentUserId && post.user.id !== currentUserId && (
            <button
              onClick={() => setDmTarget({ userId: post.user.id, name: post.user.name })}
              className="ml-auto text-xs text-ps-accent hover:text-ps-accentHover font-semibold transition-colors"
            >
              I have it — DM →
            </button>
          )}
        </div>

        {/* Reply form */}
        {replying && (
          <div className="ml-11 mt-2">
            <ReplyForm
              showSlug={showSlug} showId={showId} parentId={post.id}
              onClose={() => setReplying(false)}
            />
          </div>
        )}
      </div>

      {/* Replies thread */}
      {expanded && post.replies.length > 0 && (
        <div className="bg-ps-surface2 border-t border-ps-borderLight px-4 py-3 space-y-3">
          {post.replies.map((reply) => (
            <div key={reply.id} className="flex items-start gap-2.5">
              <Avatar name={reply.user.name} />
              <div className="flex-1 bg-white rounded-xl px-3.5 py-2.5 border border-ps-borderLight">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-ps-text">
                    {reply.user.businessName || reply.user.name}
                  </span>
                  {reply.user.businessName && (
                    <span className="text-xs bg-ps-accentLight text-ps-accent px-1.5 rounded-full font-medium">Vendor</span>
                  )}
                  <span className="text-xs text-ps-muted ml-auto">{timeAgo(reply.createdAt)}</span>
                </div>
                <p className="text-sm text-ps-text leading-relaxed">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {dmTarget && (
        <DMModal
          recipientId={dmTarget.userId}
          recipientName={dmTarget.name}
          showId={showId}
          forumPostId={post.id}
          forumPostContent={post.content}
          onClose={() => setDmTarget(null)}
        />
      )}
    </div>
  )
}

// ── Skeleton loader ────────────────────────────────────────

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

// ── Main Forum component ───────────────────────────────────

export default function Forum({ showSlug, showId, showHostId, isVendor, currentUserId, preview = false }: Props) {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [activeTag, setActiveTag] = useState<Tag>('all')
  const [composing, setComposing] = useState(false)
  const [loading, setLoading] = useState(true)
  const optimisticIds = useRef<Set<string>>(new Set())

  function handleOptimisticPost(post: Post) {
    optimisticIds.current.add(post.id)
    setPosts((prev) => [post, ...prev])
    setTotal((t) => t + 1)
  }

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (activeTag !== 'all') params.set('tag', activeTag)
    if (preview) params.set('preview', 'true')
    fetch(`/api/shows/${showSlug}/forum?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setPosts(data.posts ?? [])
        setTotal(data.total ?? 0)
      })
      .catch(() => {
        setPosts([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [showSlug, activeTag, preview])

  useEffect(() => {
    const socket = getSocket()
    socket.emit('join-show', showId)
    socket.on('new-forum-post', (post: Post) => {
      if (!preview && (activeTag === 'all' || activeTag === post.tag)) {
        if (optimisticIds.current.has(post.id)) {
          optimisticIds.current.delete(post.id)
          return
        }
        setPosts((prev) => [post, ...prev])
        setTotal((t) => t + 1)
      }
    })
    socket.on('new-forum-reply', ({ reply, parentId }: { reply: Reply; parentId: string }) => {
      setPosts((prev) => prev.map((p) =>
        p.id === parentId
          ? { ...p, replies: [...p.replies, reply], _count: { replies: p._count.replies + 1 } }
          : p
      ))
    })
    return () => {
      socket.off('new-forum-post')
      socket.off('new-forum-reply')
    }
  }, [showId, activeTag, preview])

  const forumHref = `/shows/${showSlug}/forum`

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ps-text">Community Board</h2>
          <p className="text-ps-secondary text-xs mt-0.5">
            Post what you&apos;re hunting for — vendors will find you.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {preview && total > 5 && (
            <Link href={forumHref} className="text-xs text-ps-secondary hover:text-ps-accent font-medium transition-colors flex items-center gap-1">
              View all {total} <ArrowRight size={12} />
            </Link>
          )}
          {user ? (
            <button
              onClick={() => setComposing(true)}
              className="flex items-center gap-1.5 bg-ps-accent hover:bg-ps-accentHover text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
            >
              <Plus size={14} /> New Post
            </button>
          ) : (
            <a href="/auth/register" className="flex items-center gap-1.5 bg-ps-accent hover:bg-ps-accentHover text-white text-sm font-medium px-4 py-2 rounded-full transition-colors">
              <Plus size={14} /> Join to Post
            </a>
          )}
        </div>
      </div>

      {/* Compose modal */}
      {composing && (
        <ComposeForm
          showSlug={showSlug} showId={showId}
          initialTag={activeTag}
          onClose={() => setComposing(false)}
          onPost={handleOptimisticPost}
        />
      )}

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
        <div className="space-y-3">{[1, 2, 3].map((i) => <PostSkeleton key={i} />)}</div>
      ) : posts.length === 0 ? (
        <div className="bg-white border border-ps-borderLight rounded-3xl p-12 text-center">
          <div className="text-3xl mb-3">🎴</div>
          <p className="text-ps-secondary font-medium text-sm">No posts yet</p>
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

      {/* Preview footer CTA */}
      {preview && total > 5 && !loading && (
        <Link
          href={forumHref}
          className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-ps-borderLight bg-white hover:border-ps-accent hover:text-ps-accent text-ps-secondary text-sm font-medium transition-all"
        >
          View all {total} posts <ArrowRight size={14} />
        </Link>
      )}
    </div>
  )
}
