import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/login/actions'
import ThemeToggle from '../components/ThemeToggle'

export default async function BoardsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between">
        <span className="font-semibold text-gray-900 dark:text-white">Kanban</span>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <span className="text-sm text-gray-500 dark:text-gray-400">{profile?.username}</span>
          <form action={signOut}>
            <button type="submit" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              Sign out
            </button>
          </form>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  )
}