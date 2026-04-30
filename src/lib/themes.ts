export const THEMES = {
  red: {
    id: 'red',
    name: 'Classic Red',
    swatchClass: 'bg-red-500',
    gradient: 'from-red-50 via-white to-rose-50',
    badgeClass: 'bg-red-50 text-red-600 border-red-200',
  },
  navy: {
    id: 'navy',
    name: 'Midnight Navy',
    swatchClass: 'bg-blue-900',
    gradient: 'from-blue-50 via-white to-slate-100',
    badgeClass: 'bg-blue-50 text-blue-900 border-blue-200',
  },
  emerald: {
    id: 'emerald',
    name: 'Forest Green',
    swatchClass: 'bg-emerald-600',
    gradient: 'from-emerald-50 via-white to-green-50',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  gold: {
    id: 'gold',
    name: 'Flame Gold',
    swatchClass: 'bg-amber-500',
    gradient: 'from-amber-50 via-white to-yellow-50',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  slate: {
    id: 'slate',
    name: 'Storm Gray',
    swatchClass: 'bg-slate-700',
    gradient: 'from-slate-100 via-white to-gray-50',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
  },
  purple: {
    id: 'purple',
    name: 'Royal Purple',
    swatchClass: 'bg-violet-600',
    gradient: 'from-violet-50 via-white to-purple-50',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
  },
} as const

export type ThemeId = keyof typeof THEMES

export function getTheme(id?: string | null) {
  return THEMES[(id ?? 'red') as ThemeId] ?? THEMES.red
}
