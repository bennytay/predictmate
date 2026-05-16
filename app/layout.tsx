import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'PredictMate',
  description: 'Social predictions about your personal life.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#0d0d11] text-zinc-100 antialiased">
        <nav className="sticky top-0 z-50 border-b border-zinc-800/60 bg-[#0d0d11]/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <a href="/" className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white">PredictMate</span>
            </a>
            <div className="flex items-center gap-5">
              <a href="/" className="text-sm font-medium text-zinc-400 hover:text-white transition">
                Explore
              </a>
              <a
                href="/create"
                className="rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-violet-500 transition"
              >
                + Create
              </a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
