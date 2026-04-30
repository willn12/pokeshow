'use client'
import { useState, useEffect } from 'react'

interface Section { id: string; label: string }

export default function ShowNav({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20)

      const scrollY = window.scrollY + 80
      let current: string | null = null
      for (const s of sections) {
        const el = document.getElementById(s.id)
        if (el && el.offsetTop <= scrollY) current = s.id
      }
      setActive(current)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [sections])

  function scrollTo(id: string) {
    const el = document.getElementById(id)
    if (!el) return
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 52, behavior: 'smooth' })
  }

  return (
    <div
      className={`sticky top-0 z-30 -mx-4 px-4 transition-all duration-200 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-ps-borderLight shadow-[0_1px_12px_rgba(0,0,0,0.06)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="flex gap-1 overflow-x-auto py-2.5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => scrollTo(s.id)}
            className={`shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all ${
              active === s.id
                ? 'bg-ps-accent text-white'
                : 'text-ps-secondary hover:text-ps-text hover:bg-ps-surface2'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
