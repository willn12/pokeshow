'use client'
import { useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  recipientId: string
  recipientName: string
  showId: string
  forumPostId: string
  forumPostContent: string
  onClose: () => void
}

export default function DMModal({ recipientId, recipientName, showId, forumPostId, forumPostContent, onClose }: Props) {
  const [content, setContent] = useState(`Hey! I have what you're looking for — come visit my table!`)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSend() {
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId, showId, content, forumPostId }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }
      setSent(true)
      setTimeout(onClose, 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white border border-ps-borderLight rounded-3xl p-6 max-w-md w-full shadow-card-hover">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-ps-text">Message {recipientName}</h3>
          <button onClick={onClose} className="text-ps-muted hover:text-ps-text transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="bg-ps-surface2 rounded-2xl p-3 mb-4 border border-ps-borderLight">
          <span className="text-xs uppercase tracking-wide text-ps-muted font-medium block mb-1">Replying to their post</span>
          <p className="text-ps-secondary text-sm line-clamp-2">{forumPostContent}</p>
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        {sent ? (
          <div className="text-center py-4">
            <div className="text-2xl mb-2">✓</div>
            <p className="text-green-600 font-medium text-sm">Message sent!</p>
          </div>
        ) : (
          <>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="w-full bg-ps-surface2 border border-ps-border rounded-xl px-4 py-2.5 text-ps-text text-sm focus:outline-none focus:border-ps-accent focus:ring-2 focus:ring-ps-accentLight transition-all resize-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 bg-ps-surface2 hover:bg-ps-border text-ps-secondary text-sm font-medium py-2.5 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !content.trim()}
                className="flex-1 bg-ps-accent hover:bg-ps-accentHover disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
              >
                {sending ? 'Sending…' : 'Send Message'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
