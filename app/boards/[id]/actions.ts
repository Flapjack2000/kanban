'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createColumn(boardId: string, formData: FormData) {
  const supabase = await createClient()

  const { data: columns } = await supabase
    .from('columns')
    .select('position')
    .eq('board_id', boardId)
    .order('position', { ascending: false })
    .limit(1)

  const position = (columns?.[0]?.position ?? 0) + 1

  const { error } = await supabase
    .from('columns')
    .insert({
      board_id: boardId,
      title: formData.get('title') as string,
      position,
    })

  if (error) throw new Error(error.message)
  revalidatePath(`/boards/${boardId}`)
}

export async function createCard(columnId: string, boardId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: cards } = await supabase
    .from('cards')
    .select('position')
    .eq('column_id', columnId)
    .order('position', { ascending: false })
    .limit(1)

  const position = (cards?.[0]?.position ?? 0) + 1

  const { error } = await supabase
    .from('cards')
    .insert({
      column_id: columnId,
      creator_id: user.id,
      title: formData.get('title') as string,
      position,
    })

  if (error) throw new Error(error.message)
  revalidatePath(`/boards/${boardId}`)
}

export async function deleteColumn(columnId: string, boardId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('columns').delete().eq('id', columnId)
  if (error) throw new Error(error.message)
  revalidatePath(`/boards/${boardId}`)
}

export async function deleteCard(cardId: string, boardId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('cards').delete().eq('id', cardId)
  if (error) throw new Error(error.message)
  revalidatePath(`/boards/${boardId}`)
}

export async function renameColumn(columnId: string, title: string, boardId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('columns')
    .update({ title })
    .eq('id', columnId)
  if (error) throw new Error(error.message)
  revalidatePath(`/boards/${boardId}`)
}

export async function renameCard(cardId: string, title: string, boardId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('cards')
    .update({ title })
    .eq('id', cardId)
  if (error) throw new Error(error.message)
  revalidatePath(`/boards/${boardId}`)
}

export async function moveCard(cardId: string, newColumnId: string, newPosition: number, boardId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('cards')
    .update({ column_id: newColumnId, position: newPosition })
    .eq('id', cardId)
  if (error) throw new Error(error.message)
  revalidatePath(`/boards/${boardId}`)
}

export async function moveColumn(columnId: string, newPosition: number, boardId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('columns')
    .update({ position: newPosition })
    .eq('id', columnId)
  if (error) throw new Error(error.message)
  revalidatePath(`/boards/${boardId}`)
}