import { createClient } from '@/lib/supabase/server'
import { createBoard } from './actions'
import BoardCard, { BoardType } from './BoardCard'
import { Plus } from 'lucide-react'
import Link from 'next/link'

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => {
  return (
    <div>
      <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">{title}</h2>
      {children}
    </div>
  )
}

export default async function BoardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: ownedBoards } = await supabase
    .from('boards')
    .select('id, title, created_at')
    .eq('owner_id', user!.id)
    .order('created_at', { ascending: false })

  const { data: memberBoards } = await supabase
    .from('board_members')
    .select('role, boards(id, title, created_at)')
    .eq('user_id', user!.id)

  const sharedBoards = (memberBoards?.map(m => ({
    ...(m.boards as BoardType),
    role: m.role,
  })) ?? [])

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Your boards</h1>
      </div>

      <Section title="Owned boards">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ownedBoards?.map((board: BoardType) => (
            <BoardCard isOwner key={board.id} board={board} />
          ))}
          <form action={createBoard}>
            <div className="bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-5 hover:border-indigo-400 transition-colors">
              <input
                name="title"
                type="text"
                placeholder="New board name..."
                autoComplete="off"
                required
                className="w-full text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none bg-transparent"
              />
              <button
                type="submit"
                className="mt-3 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors"
              >
                <span className='flex gap-2 items-center'><Plus size={16} /> Create board</span>
              </button>
            </div>
          </form>
        </div>
        {ownedBoards?.length === 0 && (
          <p className="text-sm text-gray-400 mt-4">No boards yet, create one above.</p>
        )}
      </Section>

      {sharedBoards.length > 0 && (
        <div className="mt-10">
          <Section title="Shared with me">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sharedBoards.map((board: BoardType) => (
                <BoardCard key={board.id} board={board} isOwner={false} />
              ))}
            </div>
          </Section>
        </div>
      )}

      <hr className='mt-10 mb-4 dark:text-indigo-400 text-indigo-700' />
      <Link className='dark:text-indigo-400 text-indigo-700 hover:underline' href="https://buymeacoffee.com/zachwilliams">
        {"☕ Buy me a coffee :)"}
      </Link>
    </div>
  )
}