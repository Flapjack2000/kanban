'use client'

import Link from 'next/link'
import { useState } from 'react'
import { renameBoard, deleteBoard } from './actions'

type Board = {
  id: string
  title: string
  created_at: string | null
}

export default function BoardCard({ board }: { board: Board }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(board.title)

  async function handleRename() {
    if (title.trim() && title !== board.title) {
      await renameBoard(board.id, title.trim())
    }
    setEditing(false)
  }

  async function handleDelete() {
    if (confirm(`Delete "${board.title}"? This cannot be undone.`)) {
      await deleteBoard(board.id)
    }
  }

  return (
    <div className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all">
      {editing ? (
        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={handleRename}
          onKeyDown={e => {
            if (e.key === 'Enter') handleRename()
            if (e.key === 'Escape') { setTitle(board.title); setEditing(false) }
          }}
          className="w-full text-sm font-medium text-gray-900 dark:text-white bg-transparent outline-none border-b border-indigo-400"
        />
      ) : (
        <Link href={`/boards/${board.id}`}>
          <h2 className="font-medium text-gray-900 dark:text-white">{title}</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {new Date(board.created_at ?? '').toLocaleDateString()}
          </p>
        </Link>
      )}

      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-1.5 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          ✎
        </button>
        <button
          onClick={handleDelete}
          className="text-xs text-gray-400 hover:text-red-500 px-1.5 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          ✕
        </button>
      </div>
    </div>
  )
}