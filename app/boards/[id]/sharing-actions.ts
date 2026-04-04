'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { getBoardRole } from '@/lib/boardRole'
import { redirect } from 'next/navigation'

export async function addMemberByUsername(boardId: string, username: string, role: 'editor' | 'viewer') {
  const callerRole = await getBoardRole(boardId)
  if (callerRole !== 'owner') throw new Error('Only owners can invite members')

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single()

  if (!profile) return { error: 'No user found with that username' }

  const { data: board } = await supabaseAdmin
    .from('boards')
    .select('owner_id')
    .eq('id', boardId)
    .single()

  if (board?.owner_id === profile.id) return { error: 'That user is already the board owner' }

  const { error } = await supabaseAdmin
    .from('board_members')
    .upsert({ board_id: boardId, user_id: profile.id, role }, { onConflict: 'board_id,user_id' })

  if (error) return { error: error.message }

  revalidatePath(`/boards/${boardId}`)
  return { success: true }
}

export async function removeMember(boardId: string, userId: string) {
  const callerRole = await getBoardRole(boardId)
  if (callerRole !== 'owner') throw new Error('Only owners can remove members')

  const { error } = await supabaseAdmin
    .from('board_members')
    .delete()
    .eq('board_id', boardId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  revalidatePath(`/boards/${boardId}`)
}

export async function changeMemberRole(boardId: string, userId: string, role: 'editor' | 'viewer') {
  const callerRole = await getBoardRole(boardId)
  if (callerRole !== 'owner') throw new Error('Only owners can change roles')

  const { error } = await supabaseAdmin
    .from('board_members')
    .update({ role })
    .eq('board_id', boardId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  revalidatePath(`/boards/${boardId}`)
}

export async function leaveBoard(boardId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('board_members')
    .delete()
    .eq('board_id', boardId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  redirect('/boards')
}

export async function createInviteLink(boardId: string, role: 'editor' | 'viewer') {
  const callerRole = await getBoardRole(boardId)
  if (callerRole !== 'owner') throw new Error('Only owners can create invite links')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('board_invites')
    .insert({ board_id: boardId, created_by: user.id, role })
    .select('token')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath(`/boards/${boardId}`)
  return { token: data.token }
}

export async function deleteInviteLink(boardId: string, inviteId: string) {
  const callerRole = await getBoardRole(boardId)
  if (callerRole !== 'owner') throw new Error('Only owners can delete invite links')

  const supabase = await createClient()
  const { error } = await supabase
    .from('board_invites')
    .delete()
    .eq('id', inviteId)

  if (error) throw new Error(error.message)
  revalidatePath(`/boards/${boardId}`)
}