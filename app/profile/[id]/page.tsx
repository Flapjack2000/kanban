import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

type Board = {
  id: string
  title: string
  created_at: string | null
}

function BoardGrid({ boards, fallback }: { boards: Board[], fallback: string }) {
  if (boards.length === 0) return <p className="text-sm text-gray-400 dark:text-gray-500">{fallback}</p>
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {boards.map(board => (
        <Link key={board.id} href={`/boards/${board.id}`}>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">{board.title}</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {board.created_at ? new Date(board.created_at).toLocaleDateString() : '—'}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">{title}</h2>
      {children}
    </div>
  )
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  const { data: ownedBoards } = await supabase
    .from('boards')
    .select('id, title, created_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const { data: memberBoards } = await supabase
    .from('board_members')
    .select('role, boards(id, title, created_at)')
    .eq('user_id', user.id)

  const editors = (memberBoards?.filter(m => m.role === 'editor').map(m => m.boards).filter(Boolean) ?? []) as Board[]
  const viewers = (memberBoards?.filter(m => m.role === 'viewer').map(m => m.boards).filter(Boolean) ?? []) as Board[]

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Profile</h1>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex flex-col gap-1 max-w-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Username: <span className="text-gray-900 dark:text-white font-medium">{profile?.username}</span>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Email: <span className="text-gray-900 dark:text-white font-medium">{user.email}</span>
          </p>
        </div>
      </div>

      <Section title="Owned boards">
        <BoardGrid boards={ownedBoards ?? []} fallback="You don't own any boards yet." />
      </Section>

      <Section title="Editor boards">
        <BoardGrid boards={editors} fallback="You haven't been added as an editor on any boards." />
      </Section>

      <Section title="Viewer boards">
        <BoardGrid boards={viewers} fallback="You haven't been added as a viewer on any boards." />
      </Section>
    </div>
  )
}