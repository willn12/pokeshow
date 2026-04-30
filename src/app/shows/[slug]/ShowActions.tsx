'use client'
import Link from 'next/link'
import { Settings } from 'lucide-react'

interface Show { id: string; slug: string; hostId: string }
interface Props {
  show: Show
  isHost: boolean
  isVendor: boolean
  userId?: string
  applicationStatus?: string | null
}

export default function ShowActions({ show, isHost, isVendor, userId, applicationStatus }: Props) {
  if (isHost) {
    return null
  }

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
