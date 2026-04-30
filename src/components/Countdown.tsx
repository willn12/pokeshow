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

  const units = [
    { label: 'Days',  val: time.d },
    { label: 'Hours', val: time.h },
    { label: 'Min',   val: time.m },
    { label: 'Sec',   val: time.s },
  ]

  return (
    <div className="rounded-3xl mb-7 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
      <div className="px-6 py-8">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest text-center mb-7">
          Show Starts In
        </p>
        <div className="flex justify-center gap-2 sm:gap-6">
          {units.map(({ label, val }, i) => (
            <div key={label} className="flex items-center gap-2 sm:gap-6">
              <div className="text-center">
                <div className="bg-white/10 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 mb-2">
                  <div className="text-3xl sm:text-5xl font-bold text-white tabular-nums leading-none">
                    {String(val).padStart(2, '0')}
                  </div>
                </div>
                <div className="text-xs text-white/40 font-semibold uppercase tracking-widest">{label}</div>
              </div>
              {i < 3 && <span className="text-xl font-light text-white/20 mb-6">:</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
