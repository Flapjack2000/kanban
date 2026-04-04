'use client'

import Link from 'next/link'
import { useState } from 'react'
import { renameBoard, deleteBoard } from '../actions'
import SharingPanel from './SharingPanel'

type Member = {
  user_id: string
  role: string
  profiles: { username: string } | null
}

type Invite = {
  id: string
  token: string
  role: string
  expires_at: string | null
}

type Props = {
  boardId: string
  title: string
  currentUserId: string
  currentRole: 'owner' | 'editor' | 'viewer'
  members: Member[]
  invites: Invite[]
}

export default function BoardHeader({ boardId, title, currentUserId, currentRole, members, invites }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(title)

  const isOwner = currentRole === 'owner'

  async function handleRename() {
    if (value.trim() && value !== title) {
      await renameBoard(boardId, value.trim())
    }
    setEditing(false)
  }

  async function handleDelete() {
    if (confirm(`Delete "${value}"? This cannot be undone.`)) {
      await deleteBoard(boardId)
    }
  }

  return (
    <div className="px-6 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
      <nav className="flex items-center gap-2 text-sm">
        <Link
          href="/boards"
          className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Boards
        </Link>
        <span className="text-gray-300 dark:text-gray-700">/</span>
        {editing && isOwner ? (
          <input
            autoFocus
            value={value}
            onChange={e => setValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={e => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') { setValue(title); setEditing(false) }
            }}
            className="text-sm font-medium text-gray-900 dark:text-white bg-transparent outline-none border-b border-indigo-400"
          />
        ) : (
          <span
            onDoubleClick={() => isOwner && setEditing(true)}
            className={`text-gray-900 dark:text-white font-medium ${isOwner ? 'cursor-text' : ''}`}
            title={isOwner ? 'Double-click to rename' : undefined}
          >
            {value}
          </span>
        )}
      </nav>

      {/* Members */}
      <div className="flex items-center gap-2">
        {members.map(m => (
          <span
            key={m.user_id}
            title={`${m.profiles?.username} (${m.role})`}
            className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium"
          >
            {m.profiles?.username}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <SharingPanel
          boardId={boardId}
          currentUserId={currentUserId}
          currentRole={currentRole}
          members={members}
          invites={invites}
        />
        {isOwner && (
          <button
            onClick={handleDelete}
            className="text-xs cursor-pointer text-gray-400 hover:text-red-500 transition-colors"
          >
            Delete board
          </button>
        )}
      </div>
    </div>
  )
}