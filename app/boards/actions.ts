'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createBoard(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const title = formData.get('title') as string

  const { data, error } = await supabase
    .from('boards')
    .insert({ title, owner_id: user.id })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  redirect(`/boards/${data.id}`)
}

export async function renameBoard(boardId: string, title: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('boards')
    .update({ title })
    .eq('id', boardId)
  if (error) throw new Error(error.message)
  revalidatePath('/boards')
  revalidatePath(`/boards/${boardId}`)
}

export async function deleteBoard(boardId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('boards')
    .delete()
    .eq('id', boardId)
  if (error) throw new Error(error.message)
  redirect('/boards')
}