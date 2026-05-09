export const THEMES = {
  red: {
    id: 'red',
    name: 'Classic Red',
    swatchClass: 'bg-red-500',
    gradient: 'from-red-50 via-white to-rose-50',
    badgeClass: 'bg-red-50 text-red-600 border-red-200',
    heroGradient: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 50%, #4c0519 100%)',
    heroAccent: '#f87171',
  },
  navy: {
    id: 'navy',
    name: 'Midnight Navy',
    swatchClass: 'bg-blue-900',
    gradient: 'from-blue-50 via-white to-slate-100',
    badgeClass: 'bg-blue-50 text-blue-900 border-blue-200',
    heroGradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #172554 100%)',
    heroAccent: '#60a5fa',
  },
  emerald: {
    id: 'emerald',
    name: 'Forest Green',
    swatchClass: 'bg-emerald-600',
    gradient: 'from-emerald-50 via-white to-green-50',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    heroGradient: 'linear-gradient(135deg, #022c22 0%, #14532d 50%, #134e4a 100%)',
    heroAccent: '#34d399',
  },
  gold: {
    id: 'gold',
    name: 'Flame Gold',
    swatchClass: 'bg-amber-500',
    gradient: 'from-amber-50 via-white to-yellow-50',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    heroGradient: 'linear-gradient(135deg, #451a03 0%, #7c2d12 50%, #451a03 100%)',
    heroAccent: '#fbbf24',
  },
  slate: {
    id: 'slate',
    name: 'Storm Gray',
    swatchClass: 'bg-slate-700',
    gradient: 'from-slate-100 via-white to-gray-50',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    heroGradient: 'linear-gradient(135deg, #020617 0%, #1e293b 50%, #111827 100%)',
    heroAccent: '#94a3b8',
  },
  purple: {
    id: 'purple',
    name: 'Royal Purple',
    swatchClass: 'bg-violet-600',
    gradient: 'from-violet-50 via-white to-purple-50',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
    heroGradient: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 50%, #1e1b4b 100%)',
    heroAccent: '#a78bfa',
  },
} as const

export type ThemeId = keyof typeof THEMES

export function getTheme(id?: string | null) {
  return THEMES[(id ?? 'red') as ThemeId] ?? THEMES.red
}
