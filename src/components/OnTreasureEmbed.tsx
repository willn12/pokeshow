'use client'
import { useEffect } from 'react'

interface Props {
  eventSlug?: string | null
  username?: string | null
  type: 'tickets' | 'application' | 'map' | 'profile'
}

const iframeStyle = { width: '100%', border: 'none', borderRadius: '10px', padding: 0 } as const
const sandbox = 'allow-same-origin allow-forms allow-scripts allow-popups allow-popups-to-escape-sandbox'

function useOnTreasureResize() {
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== 'https://www.ontreasure.com') return
      const data = event.data as { height?: string; iframeId?: string } | null
      if (!data?.height || !data?.iframeId) return
      const iframe = document.getElementById(data.iframeId) as HTMLIFrameElement | null
      if (iframe) iframe.style.height = Math.max(parseInt(data.height, 10), 10) + 'px'
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])
}

export function OnTreasureTickets({ eventSlug }: { eventSlug: string }) {
  useOnTreasureResize()
  const id = `treasure-embed-tickets-${eventSlug}`
  return (
    <iframe
      id={id}
      style={iframeStyle}
      sandbox={sandbox}
      src={`https://www.ontreasure.com/events/${eventSlug}/embed-checkout?embed=true&iframeId=${id}`}
      title="Ticket Booking"
      loading="lazy"
      allow="fullscreen; payment"
    />
  )
}

export function OnTreasureApplication({ eventSlug }: { eventSlug: string }) {
  useOnTreasureResize()
  const id = `treasure-embed-application-${eventSlug}`
  return (
    <iframe
      id={id}
      style={iframeStyle}
      sandbox={sandbox}
      src={`https://www.ontreasure.com/events/${eventSlug}/embed-application?iframeId=${id}`}
      title="Vendor Application"
      loading="lazy"
      allow="fullscreen; payment"
    />
  )
}

export function OnTreasureMap({ eventSlug }: { eventSlug: string }) {
  useOnTreasureResize()
  const id = `treasure-embed-map-${eventSlug}`
  return (
    <iframe
      id={id}
      style={iframeStyle}
      sandbox={sandbox}
      src={`https://www.ontreasure.com/events/${eventSlug}/venue-map?iframeId=${id}`}
      title="Vendor Map"
      loading="lazy"
      allow="fullscreen; payment"
    />
  )
}

export function OnTreasureProfile({ username }: { username: string }) {
  useOnTreasureResize()
  const id = `treasure-embed-profile-${username}`
  return (
    <iframe
      id={id}
      style={iframeStyle}
      sandbox={sandbox}
      src={`https://www.ontreasure.com/u/${username}/embed?iframeId=${id}`}
      title="Host Profile"
      loading="lazy"
      allow="fullscreen; payment"
    />
  )
}

// Default export kept for any legacy usage
export default function OnTreasureEmbed({ eventSlug, username, type }: Props) {
  if (type === 'tickets' && eventSlug) return <OnTreasureTickets eventSlug={eventSlug} />
  if (type === 'application' && eventSlug) return <OnTreasureApplication eventSlug={eventSlug} />
  if (type === 'map' && eventSlug) return <OnTreasureMap eventSlug={eventSlug} />
  if (type === 'profile' && username) return <OnTreasureProfile username={username} />
  return null
}
