'use client'

import { useState } from 'react'
import {
  addMemberByUsername,
  removeMember,
  changeMemberRole,
  leaveBoard,
  createInviteLink,
  deleteInviteLink,
} from './sharing-actions'

type Member = {
  user_id: string
  role: string
  profiles: { username: string; avatar_url: string | null } | null
}

type Invite = {
  id: string
  token: string
  role: string
  expires_at: string | null
}

type Props = {
  boardId: string
  currentUserId: string
  currentRole: 'owner' | 'editor' | 'viewer'
  members: Member[]
  invites: Invite[]
}

export default function SharingPanel({ boardId, currentUserId, currentRole, members, invites }: Props) {
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor')
  const [addRole, setAddRole] = useState<'editor' | 'viewer'>('editor')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [localInvites, setLocalInvites] = useState(invites)
  const [copied, setCopied] = useState<string | null>(null)

  const isOwner = currentRole === 'owner'

  async function handleAdd() {
    if (!username.trim()) return
    setError(null)
    setLoading(true)
    const result = await addMemberByUsername(boardId, username.trim(), addRole)
    if (result?.error) setError(result.error)
    else setUsername('')
    setLoading(false)
  }

  async function handleCreateLink() {
    const result = await createInviteLink(boardId, inviteRole)
    if (result?.token) {
      setLocalInvites(prev => [...prev, {
        id: crypto.randomUUID(),
        token: result.token,
        role: inviteRole,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }])
    }
  }

  async function handleDeleteLink(inviteId: string) {
    setLocalInvites(prev => prev.filter(i => i.id !== inviteId))
    await deleteInviteLink(boardId, inviteId)
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/invite/${token}`
    navigator.clipboard.writeText(url)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="cursor-pointer text-xs px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors font-medium"
      >
        Share
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white">Share board</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
            </div>

            <div className="p-6 flex flex-col gap-6 max-h-[70vh] overflow-y-auto">

              {/* Add by username */}
              {isOwner && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Add member</h3>
                  <div className="flex gap-2">
                    <input
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAdd()}
                      placeholder="Username..."
                      autoComplete="off"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <select
                      value={addRole}
                      onChange={e => setAddRole(e.target.value as 'editor' | 'viewer')}
                      className="px-2 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                    >
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      onClick={handleAdd}
                      disabled={loading}
                      className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
                </div>
              )}

              {/* Members list */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Members</h3>
                <div className="flex flex-col gap-2">
                  {members.map(member => (
                    <div key={member.user_id} className="flex items-center justify-between gap-2 py-1">
                      <span className="text-sm text-gray-800 dark:text-gray-200">
                        {member.profiles?.username ?? 'Unknown'}
                      </span>
                      <div className="flex items-center gap-2">
                        {isOwner && member.user_id !== currentUserId && member.role !== 'owner' ? (
                          <>
                            <select
                              value={member.role}
                              onChange={e => changeMemberRole(boardId, member.user_id, e.target.value as 'editor' | 'viewer')}
                              className="text-xs border border-gray-300 dark:border-gray-700 rounded-md px-1.5 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none"
                            >
                              <option value="editor">Editor</option>
                              <option value="viewer">Viewer</option>
                            </select>
                            <button
                              onClick={() => removeMember(boardId, member.user_id)}
                              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                            >
                              Remove
                            </button>
                          </>
                        ) : (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${member.role === 'owner' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' :
                            member.role === 'editor' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                              'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                            }`}>
                            {member.role}
                          </span>
                        )}
                        {member.user_id === currentUserId && member.role !== 'owner' && (
                          <button
                            onClick={() => leaveBoard(boardId)}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                          >
                            Leave
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invite links */}
              {isOwner && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Invite links</h3>
                  <div className="flex gap-2 mb-3">
                    <select
                      value={inviteRole}
                      onChange={e => setInviteRole(e.target.value as 'editor' | 'viewer')}
                      className="px-2 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                    >
                      <option value="editor">Editor link</option>
                      <option value="viewer">Viewer link</option>
                    </select>
                    <button
                      onClick={handleCreateLink}
                      className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Generate link
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    {localInvites.map(invite => (
                      <div key={invite.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {`${window.location.origin}/invite/${invite.token}`}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {invite.role} · expires {invite.expires_at ? new Date(invite.expires_at).toLocaleDateString() : 'never'}
                          </p>
                        </div>
                        <button
                          onClick={() => copyLink(invite.token)}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 shrink-0"
                        >
                          {copied === invite.token ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                          onClick={() => handleDeleteLink(invite.id)}
                          className="text-xs text-gray-400 hover:text-red-500 shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {localInvites.length === 0 && (
                      <p className="text-xs text-gray-400">No active invite links.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Leave board (for non-owners) */}
              {!isOwner && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                  <button
                    onClick={() => leaveBoard(boardId)}
                    className="text-sm text-red-500 hover:text-red-700 transition-colors"
                  >
                    Leave board
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}