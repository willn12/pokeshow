import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/AuthContext'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PokeShow — Pokemon Card Show Platform',
  description: 'Find and host Pokemon card shows near you',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-ps-bg text-ps-text min-h-screen`}>
        <AuthProvider>
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 py-10">{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
