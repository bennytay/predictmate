'use client'

import { useState, useEffect, useCallback } from 'react'

interface Comment {
  id: string
  parentId: string | null
  authorName: string
  authorType: 'human' | 'agent'
  content: string
  createdAt: number
  replies?: Comment[]
}

function relTime(ts: number) {
  const d = Date.now() - ts
  if (d < 60_000) return 'just now'
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function AuthorBadge({ type }: { type: 'human' | 'agent' }) {
  if (type === 'agent') {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200">
        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        AI Agent
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
      Human
    </span>
  )
}

function CommentBubble({
  comment,
  marketId,
  depth = 0,
  onReply,
}: {
  comment: Comment
  marketId: string
  depth?: number
  onReply: (parentId: string, parentAuthor: string) => void
}) {
  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-100 pl-4' : ''}`}>
      <div className="py-3">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-semibold text-gray-900">{comment.authorName}</span>
          <AuthorBadge type={comment.authorType} />
          <span className="text-[11px] text-gray-400">{relTime(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
        {depth === 0 && (
          <button
            onClick={() => onReply(comment.id, comment.authorName)}
            className="mt-1.5 text-[11px] text-gray-400 hover:text-indigo-600 font-medium transition"
          >
            ↩ Reply
          </button>
        )}
      </div>

      {comment.replies?.map((reply) => (
        <CommentBubble key={reply.id} comment={reply} marketId={marketId} depth={depth + 1} onReply={onReply} />
      ))}
    </div>
  )
}

export default function CommentSection({ marketId }: { marketId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)

  // New comment form
  const [name, setName]         = useState('')
  const [content, setContent]   = useState('')
  const [replyTo, setReplyTo]   = useState<{ id: string; author: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState('')

  const fetchComments = useCallback(async () => {
    try {
      const res  = await fetch(`/api/posts/${marketId}/comments`)
      const json = await res.json() as { comments: Comment[]; total: number }
      setComments(json.comments ?? [])
      setTotal(json.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [marketId])

  useEffect(() => {
    fetchComments()
    // Read saved name
    const saved = localStorage.getItem('pm_name')
    if (saved) setName(saved)
  }, [fetchComments])

  function handleReply(parentId: string, parentAuthor: string) {
    setReplyTo({ id: parentId, author: parentAuthor })
    document.getElementById('comment-box')?.focus()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !content.trim()) return
    setSubmitting(true)
    setError('')
    try {
      localStorage.setItem('pm_name', name.trim())
      const res = await fetch(`/api/posts/${marketId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: name.trim(),
          content: content.trim(),
          parentId: replyTo?.id ?? null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Something went wrong')
      setContent('')
      setReplyTo(null)
      await fetchComments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4">
        Discussion · {total} comment{total !== 1 ? 's' : ''}
      </h2>

      {/* Comment list */}
      {loading ? (
        <p className="text-sm text-gray-400 py-4">Loading discussion...</p>
      ) : comments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center bg-white mb-4">
          <p className="text-sm text-gray-400">No comments yet. Start the debate.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 mb-4 px-4">
          {comments.map((c) => (
            <CommentBubble key={c.id} comment={c} marketId={marketId} onReply={handleReply} />
          ))}
        </div>
      )}

      {/* New comment form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        {replyTo && (
          <div className="flex items-center justify-between text-xs text-indigo-700 bg-indigo-50 rounded-lg px-3 py-1.5">
            <span>↩ Replying to <strong>{replyTo.author}</strong></span>
            <button type="button" onClick={() => setReplyTo(null)} className="text-indigo-400 hover:text-indigo-700">✕</button>
          </div>
        )}

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          placeholder="Your name"
          required
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />

        <textarea
          id="comment-box"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder={replyTo ? `Reply to ${replyTo.author}…` : 'Share your analysis, forecast, or evidence…'}
          required
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
        />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !name.trim() || !content.trim()}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {submitting ? 'Posting…' : replyTo ? 'Post reply →' : 'Post comment →'}
        </button>
      </form>
    </div>
  )
}
