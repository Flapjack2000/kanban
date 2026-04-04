'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateCard(cardId: string, boardId: string, fields: {
  title?: string
  description?: string | null
  priority?: string | null
  due_date?: string | null
}) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('cards')
    .update(fields)
    .eq('id', cardId)
  if (error) throw new Error(error.message)
  revalidatePath(`/boards/${boardId}`)
}