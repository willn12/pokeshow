'use client'
import Link from 'next/link'

interface Show { id: string; slug: string; hostId: string }
interface Props {
  show: Show
  isHost: boolean
  isVendor: boolean
  userId?: string
  applicationStatus?: string | null
  applicationsOpen: boolean
  variant?: 'hero' | 'default'
}

export default function ShowActions({ show, isHost, isVendor, userId, applicationStatus, applicationsOpen, variant = 'default' }: Props) {
  const dark = variant === 'hero'

  if (isHost) return null

  if (isVendor || applicationStatus === 'approved') {
    return (
      <span className={`flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-full ${
        dark
          ? 'bg-green-500/20 border border-green-400/40 text-green-300'
          : 'text-green-600 font-medium bg-green-50 border border-green-200 px-4 py-2 rounded-xl'
      }`}>
        ✓ Vendor at this show
      </span>
    )
  }

  if (applicationStatus === 'pending') {
    return (
      <span className={`flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-full ${
        dark
          ? 'bg-amber-500/20 border border-amber-400/40 text-amber-300'
          : 'text-amber-600 font-medium bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl'
      }`}>
        ⏳ Application pending review
      </span>
    )
  }

  if (applicationStatus === 'rejected') {
    return (
      <span className={`flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-full ${
        dark
          ? 'bg-red-500/20 border border-red-400/40 text-red-300'
          : 'text-red-600 font-medium bg-red-50 border border-red-200 px-4 py-2 rounded-xl'
      }`}>
        ✗ Application not accepted
      </span>
    )
  }

  if (!applicationsOpen) {
    return (
      <span className={`flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-full ${
        dark
          ? 'bg-white/10 border border-white/20 text-white/50'
          : 'text-ps-secondary font-medium bg-ps-surface2 border border-ps-border px-4 py-2 rounded-xl'
      }`}>
        🔒 Applications closed
      </span>
    )
  }

  if (!userId) {
    return (
      <Link
        href="/auth/register"
        className={`text-white font-bold transition-all text-sm ${
          dark
            ? 'bg-white/15 border border-white/25 hover:bg-white/25 px-6 py-3 rounded-full backdrop-blur-sm'
            : 'bg-ps-accent hover:bg-ps-accentHover px-5 py-2 rounded-full'
        }`}
      >
        Sign up as Vendor
      </Link>
    )
  }

  return (
    <Link
      href={`/shows/${show.slug}/apply`}
      className={`text-white font-bold transition-all text-sm ${
        dark
          ? 'bg-white/15 border border-white/25 hover:bg-white/25 px-6 py-3 rounded-full backdrop-blur-sm'
          : 'bg-ps-accent hover:bg-ps-accentHover px-5 py-2 rounded-full'
      }`}
    >
      Apply as Vendor
    </Link>
  )
}
