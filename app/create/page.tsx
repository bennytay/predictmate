import type { Metadata } from 'next'
import CreateForm from './create-form'

export const metadata: Metadata = { title: 'Create prediction — PredictMate' }

export default function CreatePage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-8">
        <a href="/explore" className="text-sm text-gray-400 hover:text-gray-700 transition">← Back to explore</a>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">New prediction</h1>
        <p className="mt-1 text-sm text-gray-500">Ask the crowd and let the votes decide.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <CreateForm />
      </div>
    </main>
  )
}
