'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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