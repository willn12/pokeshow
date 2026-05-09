'use client'
import { useState, useEffect } from 'react'

export default function Countdown({ targetDate }: { targetDate: string }) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 })
  const [ready, setReady] = useState(false)
  const [past, setPast] = useState(false)

  useEffect(() => {
    function calc() {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff <= 0) { setPast(true); return }
      setTime({
        d: Math.floor(diff / 86_400_000),
        h: Math.floor((diff % 86_400_000) / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1_000),
      })
    }
    calc()
    setReady(true)
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  if (!ready || past) return null

  return (
    <div className="flex items-center justify-center gap-1 flex-wrap">
      <span className="text-xs font-semibold text-ps-muted uppercase tracking-widest mr-1">Show starts in</span>
      {[
        { val: time.d, label: 'd' },
        { val: time.h, label: 'h' },
        { val: time.m, label: 'm' },
        { val: time.s, label: 's' },
      ].map(({ val, label }, i) => (
        <span key={label} className="flex items-baseline gap-0.5">
          {i > 0 && <span className="text-ps-borderLight text-sm mr-1">·</span>}
          <span className="text-sm font-bold text-ps-text tabular-nums">{String(val).padStart(2, '0')}</span>
          <span className="text-xs text-ps-muted">{label}</span>
        </span>
      ))}
    </div>
  )
}
