'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FAQItem { question: string; answer: string }

export default function ShowFAQ({ items }: { items: FAQItem[] }) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="border border-ps-borderLight rounded-2xl overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-ps-text hover:bg-ps-surface2 transition-colors"
          >
            <span className="pr-4">{item.question}</span>
            <ChevronDown
              size={16}
              className={`text-ps-muted shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
            />
          </button>
          {open === i && (
            <div className="border-t border-ps-borderLight px-5 py-4 text-sm text-ps-secondary leading-relaxed">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
