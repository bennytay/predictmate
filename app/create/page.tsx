import type { Metadata } from 'next'
import CreateForm from './create-form'

export const metadata: Metadata = { title: 'Create prediction — PredictMate' }

export default function CreatePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <a href="/" className="text-sm text-zinc-500 hover:text-zinc-300 transition">← Explore</a>
        <h1 className="mt-4 text-2xl font-bold text-white">New prediction</h1>
        <p className="mt-1 text-sm text-zinc-500">Ask your question — let the crowd decide.</p>
      </div>
      <CreateForm />
    </main>
  )
}
