import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ps: {
          bg: '#f5f5f7',
          surface: '#ffffff',
          surface2: '#f5f5f7',
          border: '#d2d2d7',
          borderLight: '#e8e8ed',
          text: '#1d1d1f',
          secondary: '#6e6e73',
          muted: '#86868b',
          accent: '#d63031',
          accentHover: '#b71c1c',
          accentLight: '#fff5f5',
        },
      },
      boxShadow: {
        card: '0 2px 20px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.12)',
        soft: '0 1px 4px rgba(0,0,0,0.08)',
      },
    },
  },
  safelist: [
    'bg-red-500', 'bg-blue-900', 'bg-emerald-600', 'bg-amber-500', 'bg-slate-700', 'bg-violet-600',
    'from-red-50', 'to-rose-50',
    'from-blue-50', 'to-slate-100',
    'from-emerald-50', 'to-green-50',
    'from-amber-50', 'to-yellow-50',
    'from-slate-100', 'to-gray-50',
    'from-violet-50', 'to-purple-50',
    'via-white',
    // card hero gradients
    'from-red-500', 'to-rose-600',
    'from-emerald-500', 'to-green-600',
    'from-amber-400', 'to-orange-500',
    'from-slate-500', 'to-slate-700',
    'from-violet-500', 'to-purple-700',
    // badge classes
    'bg-red-50', 'text-red-600', 'border-red-200',
    'bg-blue-50', 'text-blue-900', 'border-blue-200',
    'bg-emerald-50', 'text-emerald-700', 'border-emerald-200',
    'bg-amber-50', 'text-amber-700', 'border-amber-200',
    'bg-slate-100', 'text-slate-700', 'border-slate-300',
    'bg-violet-50', 'text-violet-700', 'border-violet-200',
  ],
  plugins: [],
}
export default config
