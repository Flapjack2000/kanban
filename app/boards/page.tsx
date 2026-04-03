import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { createBoard } from './actions'

export default async function BoardsPage() {
  const supabase = await createClient()

  const { data: boards } = await supabase
    .from('boards')
    .select('id, title, created_at')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8">Your boards</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {boards?.map(board => (
          <Link
            key={board.id}
            href={`/boards/${board.id}`}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all"          >
            <h2 className="font-medium text-gray-900 dark:text-white">{board.title}</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {new Date(board.created_at ?? '').toLocaleDateString()}
            </p>
          </Link>
        ))}

        <form action={createBoard}>
          <div className="bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-5 hover:border-indigo-400 transition-colors">
            <input
              name="title"
              type="text"
              placeholder="New board name..."
              required
              className="w-full text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none bg-transparent" />
            <button
              type="submit"
              className="mt-3 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors"
            >
              + Create board
            </button>
          </div>
        </form>
      </div>

      {boards?.length === 0 && (
        <p className="text-sm text-gray-400 mt-4">No boards yet, please create one above.</p>
      )}
    </div>
  )
}