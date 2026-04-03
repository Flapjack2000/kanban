'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'

async function resolveEmail(emailOrUsername: string): Promise<string | null> {
  if (emailOrUsername.includes('@')) return emailOrUsername

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('username', emailOrUsername)
    .single()

  console.log('profile lookup:', data, error)

  if (!data) return null

  const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(data.id)

  console.log('admin lookup:', user?.email)

  return user?.email ?? null
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const emailOrUsername = formData.get('emailOrUsername') as string
  const password = formData.get('password') as string

  const email = await resolveEmail(emailOrUsername)
  if (!email) return { error: 'No account found with that username or email.' }

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }

  redirect('/boards')
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: { username: formData.get('username') as string },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) return { error: error.message }

  return { message: 'Check your email to confirm your account.' }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}