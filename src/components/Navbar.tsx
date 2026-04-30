'use client'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { MessageCircle, Menu, X } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await logout()
    router.push('/')
  }

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-ps-borderLight sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-1.5 font-semibold text-lg tracking-tight">
          <span className="text-ps-accent">Poke</span>
          <span className="text-ps-text">Show</span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          <Link href="/" className="text-ps-secondary hover:text-ps-text transition-colors text-sm font-medium">
            Browse Shows
          </Link>
          {user ? (
            <>
              <Link href="/shows/new" className="text-ps-secondary hover:text-ps-text transition-colors text-sm font-medium">
                Host a Show
              </Link>
              <Link href="/dashboard" className="text-ps-secondary hover:text-ps-text transition-colors text-sm font-medium">
                Dashboard
              </Link>
              <Link href="/messages" className="text-ps-secondary hover:text-ps-text transition-colors">
                <MessageCircle size={18} />
              </Link>
              <div className="flex items-center gap-3 pl-2 border-l border-ps-borderLight">
                <span className="text-sm text-ps-secondary">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm bg-ps-surface2 hover:bg-ps-border text-ps-text px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="text-sm text-ps-secondary hover:text-ps-text transition-colors font-medium">
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="text-sm bg-ps-accent hover:bg-ps-accentHover text-white px-4 py-1.5 rounded-full transition-colors font-medium"
              >
                Get started
              </Link>
            </div>
          )}
        </div>

        <button className="md:hidden text-ps-secondary" onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-ps-borderLight px-4 py-5 flex flex-col gap-4">
          <Link href="/" className="text-ps-text text-sm font-medium" onClick={() => setOpen(false)}>Browse Shows</Link>
          {user ? (
            <>
              <Link href="/shows/new" className="text-ps-text text-sm font-medium" onClick={() => setOpen(false)}>Host a Show</Link>
              <Link href="/dashboard" className="text-ps-text text-sm font-medium" onClick={() => setOpen(false)}>Dashboard</Link>
              <Link href="/messages" className="text-ps-text text-sm font-medium" onClick={() => setOpen(false)}>Messages</Link>
              <button onClick={handleLogout} className="text-left text-ps-secondary text-sm">Sign out</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-ps-text text-sm font-medium" onClick={() => setOpen(false)}>Sign in</Link>
              <Link href="/auth/register" className="text-ps-accent text-sm font-medium" onClick={() => setOpen(false)}>Get started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
