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
}

export default function ShowActions({ show, isHost, isVendor, userId, applicationStatus, applicationsOpen }: Props) {
  if (isHost) return null

  // Already have a relationship with this show — always show status regardless of open/closed
  if (isVendor || applicationStatus === 'approved') {
    return (
      <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium bg-green-50 border border-green-200 px-4 py-2 rounded-xl">
        ✓ Vendor at this show
      </span>
    )
  }

  if (applicationStatus === 'pending') {
    return (
      <span className="flex items-center gap-1.5 text-sm text-amber-600 font-medium bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
        ⏳ Application pending review
      </span>
    )
  }

  if (applicationStatus === 'rejected') {
    return (
      <span className="flex items-center gap-1.5 text-sm text-red-600 font-medium bg-red-50 border border-red-200 px-4 py-2 rounded-xl">
        ✗ Application not accepted
      </span>
    )
  }

  // Applications are closed — no new applications accepted
  if (!applicationsOpen) {
    return (
      <span className="flex items-center gap-1.5 text-sm text-ps-secondary font-medium bg-ps-surface2 border border-ps-border px-4 py-2 rounded-xl">
        🔒 Applications closed
      </span>
    )
  }

  // Not logged in
  if (!userId) {
    return (
      <Link
        href="/auth/register"
        className="bg-ps-accent hover:bg-ps-accentHover text-white px-5 py-2 rounded-full text-sm font-medium transition-colors"
      >
        Sign up as Vendor
      </Link>
    )
  }

  return (
    <div className="shrink-0">
      <Link
        href={`/shows/${show.slug}/apply`}
        className="bg-ps-accent hover:bg-ps-accentHover text-white px-5 py-2 rounded-full text-sm font-medium transition-colors"
      >
        Apply as Vendor
      </Link>
    </div>
  )
}
