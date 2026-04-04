'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function deleteAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Delete owned boards (cascades to columns, cards, etc.)
  await supabaseAdmin
    .from('boards')
    .delete()
    .eq('owner_id', user.id)

  // Delete the auth user (cascades to profile via trigger)
  await supabaseAdmin.auth.admin.deleteUser(user.id)

  redirect('/login')
}