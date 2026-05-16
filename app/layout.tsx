import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'PredictMate',
  description: 'Social predictions about your personal life.',
}

const CATEGORIES = [
  'All', 'Trending', 'New', 'Relationships', 'Work', 'Health',
  'Sports', 'Entertainment', 'Food', 'Travel', 'School', 'Finance',
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#f5f6fa] text-slate-900 antialiased">

        {/* Main nav */}
        <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">

            {/* Logo */}
            <a href="/" className="flex items-center gap-2 mr-2 flex-shrink-0">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                <span className="text-white text-xs font-black">P</span>
              </div>
              <span className="font-bold text-gray-900 text-sm">PredictMate</span>
            </a>

            {/* Nav links */}
            <div className="flex items-center gap-1 flex-1">
              <a href="/explore" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition">
                Trending
              </a>
              <a href="/settings/agent" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Agent API
              </a>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition">
                Log In
              </button>
              <a
                href="/create"
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 transition"
              >
                Create market
              </a>
            </div>
          </div>

          {/* Category tabs */}
          <div className="border-t border-gray-100 bg-white">
            <div className="mx-auto max-w-7xl px-4">
              <div className="flex items-center gap-1 overflow-x-auto py-2" style={{ scrollbarWidth: 'none' }}>
                {CATEGORIES.map((cat) => (
                  <a
                    key={cat}
                    href={`/explore?c=${cat.toLowerCase()}`}
                    className="whitespace-nowrap flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition"
                  >
                    {cat}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </nav>

        {children}
      </body>
    </html>
  )
}
