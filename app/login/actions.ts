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

  const username = formData.get('username') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (username.length < 3) return { error: 'Username must be at least 3 characters.' }
  if (username.length > 20) return { error: 'Username must be 20 characters or less.' }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return { error: 'Username can only contain letters, numbers, and underscores.' }

  // Check username taken
  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single()

  if (existing) return { error: 'That username is already taken.' }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      return { error: 'An account with that email already exists.' }
    }
    return { error: error.message }
  }

  return { message: 'Check your email to confirm your account.' }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}