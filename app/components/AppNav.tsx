import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/login/actions'
import ThemeToggle from './ThemeToggle'
import Link from 'next/link'

export default async function AppNav() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between">
      <Link href="/boards">
        <span className="font-semibold text-indigo-800 dark:text-yellow-200">
          Kanban
        </span>
      </Link>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          <Link href={`/profile/${user.id}`}>
            {profile?.username}
          </Link>
        </span>
        <form action={signOut}>
          <button type="submit" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            Sign out
          </button>
        </form>
      </div>
    </nav>
  )
}