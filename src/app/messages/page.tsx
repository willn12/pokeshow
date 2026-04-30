'use client'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { getSocket } from '@/lib/socket'
import { timeAgo } from '@/lib/utils'
import { Send } from 'lucide-react'

interface Message {
  id: string; content: string; senderId: string; recipientId: string
  createdAt: string; readAt: string | null; showId: string
  sender: { id: string; name: string; businessName: string | null }
  recipient?: { id: string; name: string; businessName: string | null }
  forumPost?: { id: string; content: string } | null
}

export default function MessagesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [conversations, setConversations] = useState<Message[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [thread, setThread] = useState<Message[]>([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    fetch('/api/messages').then((r) => r.json()).then(setConversations)
  }, [user])

  useEffect(() => {
    if (!selectedId || !user) return
    fetch(`/api/messages?with=${selectedId}`).then((r) => r.json()).then(setThread)

    const socket = getSocket()
    const roomId = [user.id, selectedId].sort().join(':')
    socket.emit('join-dm', roomId)
    socket.on('new-dm', (msg: Message) => setThread((prev) => [...prev, msg]))
    return () => { socket.off('new-dm') }
  }, [selectedId, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread])

  async function sendReply() {
    if (!reply.trim() || !selectedId || !user) return
    setSending(true)
    const showId = thread[0]?.showId
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: selectedId, showId, content: reply }),
      })
      const msg = await res.json()
      if (res.ok) {
        const roomId = [user.id, selectedId].sort().join(':')
        getSocket().emit('send-dm', { ...msg, roomId })
        setThread((prev) => [...prev, msg])
        setReply('')
      }
    } finally {
      setSending(false)
    }
  }

  function getPartner(msg: Message) {
    if (!user) return null
    return msg.senderId === user.id ? msg.recipient : msg.sender
  }

  if (loading) return <div className="text-center py-20 text-ps-secondary">Loading…</div>
  if (!user) return null

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Messages</h1>
      <div className="flex gap-4 h-[600px]">
        {/* Conversation list */}
        <div className="w-72 shrink-0 bg-white border border-ps-borderLight rounded-3xl overflow-y-auto shadow-card">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-ps-secondary text-sm">No messages yet</div>
          ) : (
            conversations.map((msg) => {
              const partner = getPartner(msg)
              if (!partner) return null
              return (
                <button key={msg.id} onClick={() => setSelectedId(partner.id)}
                  className={`w-full text-left px-4 py-3.5 border-b border-ps-borderLight hover:bg-ps-surface2 transition-colors ${selectedId === partner.id ? 'bg-ps-surface2' : ''}`}>
                  <div className="font-medium text-sm text-ps-text">{partner.businessName || partner.name}</div>
                  <div className="text-xs text-ps-secondary truncate mt-0.5">{msg.content}</div>
                  <div className="text-xs text-ps-muted mt-0.5">{timeAgo(msg.createdAt)}</div>
                </button>
              )
            })
          )}
        </div>

        {/* Thread */}
        <div className="flex-1 bg-white border border-ps-borderLight rounded-3xl flex flex-col shadow-card">
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center text-ps-secondary text-sm">
              Select a conversation
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {thread.map((msg) => {
                  const isMine = msg.senderId === user.id
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm ${isMine ? 'bg-ps-accent text-white' : 'bg-ps-surface2 text-ps-text border border-ps-borderLight'}`}>
                        {msg.forumPost && (
                          <div className={`text-xs mb-1.5 pb-1.5 border-b ${isMine ? 'border-white/20 opacity-80' : 'border-ps-border text-ps-muted'}`}>
                            Re: {msg.forumPost.content.slice(0, 60)}…
                          </div>
                        )}
                        <p>{msg.content}</p>
                        <div className={`text-xs mt-1 ${isMine ? 'opacity-70' : 'text-ps-muted'}`}>{timeAgo(msg.createdAt)}</div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>
              <div className="p-4 border-t border-ps-borderLight flex gap-2">
                <input type="text" value={reply} onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendReply()}
                  placeholder="Type a message…"
                  className="flex-1 bg-ps-surface2 border border-ps-border rounded-xl px-4 py-2.5 text-sm text-ps-text focus:outline-none focus:border-ps-accent focus:ring-2 focus:ring-ps-accentLight transition-all" />
                <button onClick={sendReply} disabled={sending || !reply.trim()}
                  className="bg-ps-accent hover:bg-ps-accentHover disabled:opacity-40 text-white px-3.5 py-2.5 rounded-xl transition-colors">
                  <Send size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
